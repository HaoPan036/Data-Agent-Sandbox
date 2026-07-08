import { describe, expect, it } from "vitest";
import { runAgent } from "../agent/runAgent";
import type { AgentRun } from "../agent/types";
import type { EvaluationCase } from "./evaluationTypes";
import { scoreEvaluationCase } from "./scoringRules";
import { getEvaluationTestset } from "./testset";

function coreCase(caseId: string): EvaluationCase {
  const testCase = getEvaluationTestset("core-regression").cases.find((candidate) => candidate.caseId === caseId);

  if (!testCase) {
    throw new Error(`Missing test case ${caseId}`);
  }

  return testCase;
}

function governanceCase(caseId: string): EvaluationCase {
  const testCase = getEvaluationTestset("governance-regression").cases.find(
    (candidate) => candidate.caseId === caseId
  );

  if (!testCase) {
    throw new Error(`Missing test case ${caseId}`);
  }

  return testCase;
}

function withCriteria(testCase: EvaluationCase, passCriteria: EvaluationCase["passCriteria"]): EvaluationCase {
  return { ...testCase, passCriteria };
}

function baseRevenueRun(): AgentRun {
  const testCase = coreCase("core-001-total-revenue");

  return runAgent(testCase.userQuestion, testCase.topicId, {
    createdAt: "2026-07-08T00:00:00.000Z",
    runId: "scoring-baseline"
  });
}

describe("scoreEvaluationCase", () => {
  it("fails on intent mismatch", () => {
    const testCase = withCriteria(coreCase("core-001-total-revenue"), ["intent_match"]);
    const result = scoreEvaluationCase(testCase, { ...baseRevenueRun(), intent: "trend_analysis" });

    expect(result.status).toBe("failed");
    expect(result.failureMode).toBe("intent_mismatch");
    expect(result.failureReasons[0]).toContain("Expected intent");
  });

  it("fails when an expected metric is missing", () => {
    const testCase = withCriteria(coreCase("core-001-total-revenue"), ["metric_coverage"]);
    const result = scoreEvaluationCase(testCase, { ...baseRevenueRun(), selectedMetrics: [] });

    expect(result.status).toBe("failed");
    expect(result.failureMode).toBe("metric_mismatch");
    expect(result.failureReasons[0]).toContain("Missing expected metrics");
  });

  it("fails when an expected table is missing", () => {
    const testCase = withCriteria(coreCase("core-001-total-revenue"), ["table_coverage"]);
    const result = scoreEvaluationCase(testCase, { ...baseRevenueRun(), selectedTables: [] });

    expect(result.status).toBe("failed");
    expect(result.failureMode).toBe("table_mismatch");
    expect(result.failureReasons[0]).toContain("Missing expected tables");
  });

  it("passes blocked requests when blocking is expected", () => {
    const testCase = governanceCase("gov-001-sensitive-export");
    const run = runAgent(testCase.userQuestion, testCase.topicId, {
      createdAt: "2026-07-08T00:00:00.000Z",
      runId: "blocked-case"
    });
    const result = scoreEvaluationCase(testCase, run);

    expect(result.status).toBe("blocked_expected");
    expect(result.failureReasons).toHaveLength(0);
    expect(result.agentRun?.generatedSql).toHaveLength(0);
  });

  it("fails when SQL execution is required but no execution result exists", () => {
    const testCase = withCriteria(coreCase("core-001-total-revenue"), ["execution_success"]);
    const result = scoreEvaluationCase(testCase, { ...baseRevenueRun(), executionResult: [] });

    expect(result.status).toBe("failed");
    expect(result.failureMode).toBe("sql_execution_failed");
    expect(result.failureReasons[0]).toContain("Expected execution result");
  });

  it("fails when trace lifecycle labels are incomplete", () => {
    const testCase = withCriteria(coreCase("core-001-total-revenue"), ["trace_complete"]);
    const result = scoreEvaluationCase(testCase, { ...baseRevenueRun(), traceSteps: [] });

    expect(result.status).toBe("failed");
    expect(result.failureMode).toBe("trace_incomplete");
    expect(result.failureReasons[0]).toContain("Trace is missing");
  });
});
