import { runAgent } from "../agent/runAgent";
import type { EvaluationCaseResult, EvaluationResult, EvaluationSummary, FailureModeLabel } from "./evaluationTypes";
import { createErrorCaseResult, scoreEvaluationCase } from "./scoringRules";
import { getEvaluationTestset } from "./testset";

function createFailureModeCounts(caseResults: EvaluationCaseResult[]) {
  const counts: Record<FailureModeLabel, number> = {
    intent_mismatch: 0,
    metric_mismatch: 0,
    table_mismatch: 0,
    sql_validation_failed: 0,
    sql_execution_failed: 0,
    missing_warning: 0,
    missing_guardrail: 0,
    unexpected_guardrail: 0,
    ungrounded_answer: 0,
    empty_result: 0,
    unsupported_question: 0,
    sensitive_request_not_blocked: 0,
    trace_incomplete: 0,
    unknown: 0
  };

  for (const result of caseResults) {
    if (result.status !== "passed" && result.status !== "blocked_expected") {
      counts[result.failureMode] += 1;
    }
  }

  return counts;
}

function summarize(caseResults: EvaluationCaseResult[]): EvaluationSummary {
  const totalCases = caseResults.length;
  const passedCases = caseResults.filter((result) => result.status === "passed").length;
  const blockedCases = caseResults.filter((result) => result.status === "blocked_expected").length;
  const failedCases = caseResults.filter((result) => result.status === "failed" || result.status === "error").length;
  const needsReviewCases = caseResults.filter((result) => result.status === "needs_review").length;

  return {
    totalCases,
    passedCases,
    failedCases,
    needsReviewCases,
    blockedCases,
    passRate: totalCases === 0 ? 0 : (passedCases + blockedCases) / totalCases,
    failureModeCounts: createFailureModeCounts(caseResults)
  };
}

export function runEvaluation(testsetId: string): EvaluationResult {
  const testset = getEvaluationTestset(testsetId);
  const startedAt = new Date().toISOString();
  const runId = `eval-${testset.id}-${testset.version}-${Date.now()}`;
  const caseResults = testset.cases.map((testCase) => {
    try {
      const agentRun = runAgent(testCase.userQuestion, testCase.topicId, {
        runId: `${runId}-${testCase.caseId}`
      });

      return scoreEvaluationCase(testCase, agentRun);
    } catch (error) {
      return createErrorCaseResult(testCase, error);
    }
  });
  const completedAt = new Date().toISOString();

  return {
    testsetId: testset.id,
    testsetVersion: testset.version,
    runId,
    startedAt,
    completedAt,
    summary: summarize(caseResults),
    caseResults
  };
}

export function runEvaluationSuite(testsetId = "core-regression") {
  const result = runEvaluation(testsetId);

  return {
    total: result.summary.totalCases,
    passed: result.summary.passedCases + result.summary.blockedCases,
    passRate: result.summary.passRate,
    results: result.caseResults.map((caseResult) => ({
      caseId: caseResult.caseId,
      question: caseResult.userQuestion,
      expectedIntent: caseResult.expected.intent,
      actualIntent: caseResult.actual.intent,
      passed: caseResult.status === "passed" || caseResult.status === "blocked_expected",
      notes: caseResult.failureReasons
    }))
  };
}
