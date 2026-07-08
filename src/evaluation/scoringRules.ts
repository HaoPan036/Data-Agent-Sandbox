import type { AgentRun } from "../agent/types";
import type {
  EvaluationCase,
  EvaluationCaseActual,
  EvaluationCaseExpected,
  EvaluationCaseResult,
  EvaluationCaseStatus,
  FailureModeLabel,
  PassCriterion
} from "./evaluationTypes";

interface CriterionFailure {
  criterion: PassCriterion;
  mode: FailureModeLabel;
  reason: string;
}

const normalTraceLabels = [
  "Received question",
  "Selected topic",
  "Classified intent",
  "Selected metrics",
  "Selected tables",
  "Generated SQL",
  "Validated SQL",
  "Executed SQL",
  "Generated grounded answer",
  "Guardrail decision"
];

const blockedTraceLabels = [
  "Received question",
  "Classified intent",
  "Risk detected",
  "Guardrail blocked",
  "Safe alternative generated"
];

function includesAll(actual: string[], expected: string[]) {
  const actualLower = actual.map((value) => value.toLowerCase());

  return expected.every((value) => actualLower.includes(value.toLowerCase()));
}

function textIncludesAll(text: string, expected: string[]) {
  const textLower = text.toLowerCase();

  return expected.every((value) => textLower.includes(value.toLowerCase()));
}

function warningIncludesAll(actual: string[], expected: string[]) {
  const actualText = actual.join(" ").toLowerCase();

  return expected.every((warning) => actualText.includes(warning.toLowerCase()));
}

function totalRows(run: AgentRun) {
  return run.executionResult.reduce((total, result) => total + result.rowCount, 0);
}

function hasSqlValidationError(run: AgentRun) {
  return run.validationResults.some((result) => result.severity === "error" && !result.passed);
}

function hasExecutionError(run: AgentRun) {
  return run.executionResult.some((result) => Boolean(result.error));
}

function generatedSqlText(run: AgentRun) {
  return run.generatedSql.map((statement) => statement.sql).join("\n\n");
}

function hasCompleteTrace(run: AgentRun) {
  const expectedLabels = run.guardrailDecision === "blocked" ? blockedTraceLabels : normalTraceLabels;
  const actualLabels = run.traceSteps.map((step) => step.label);

  return expectedLabels.every((label) => actualLabels.includes(label));
}

function validationBeforeExecution(run: AgentRun) {
  const labels = run.traceSteps.map((step) => step.label);
  const validatedIndex = labels.indexOf("Validated SQL");
  const executedIndex = labels.indexOf("Executed SQL");

  return validatedIndex >= 0 && executedIndex >= 0 && validatedIndex < executedIndex;
}

function actualFromRun(run: AgentRun): EvaluationCaseActual {
  return {
    intent: run.intent,
    metrics: run.selectedMetrics,
    tables: run.selectedTables,
    guardrailDecision: run.guardrailDecision,
    warnings: run.warnings,
    sqlCount: run.generatedSql.length,
    executionCount: run.executionResult.length,
    rowCount: totalRows(run),
    traceLabels: run.traceSteps.map((step) => step.label)
  };
}

function expectedFromCase(testCase: EvaluationCase): EvaluationCaseExpected {
  return {
    intent: testCase.expectedIntent,
    metrics: testCase.expectedMetrics,
    tables: testCase.expectedTables,
    guardrailDecision: testCase.expectedGuardrailDecision,
    warnings: testCase.expectedWarnings,
    sqlRequired: testCase.expectedSqlRequired,
    executionRequired: testCase.expectedExecutionRequired,
    answerMustInclude: testCase.expectedAnswerMustInclude
  };
}

function evaluateCriterion(testCase: EvaluationCase, run: AgentRun, criterion: PassCriterion): CriterionFailure | undefined {
  if (criterion === "intent_match" && run.intent !== testCase.expectedIntent) {
    return {
      criterion,
      mode: testCase.expectedIntent === "unknown" ? "unsupported_question" : "intent_mismatch",
      reason: `Expected intent ${testCase.expectedIntent}, got ${run.intent}.`
    };
  }

  if (criterion === "metric_coverage" && !includesAll(run.selectedMetrics, testCase.expectedMetrics)) {
    return {
      criterion,
      mode: "metric_mismatch",
      reason: `Missing expected metrics: ${testCase.expectedMetrics
        .filter((metric) => !run.selectedMetrics.includes(metric))
        .join(", ")}.`
    };
  }

  if (criterion === "table_coverage" && !includesAll(run.selectedTables, testCase.expectedTables)) {
    return {
      criterion,
      mode: "table_mismatch",
      reason: `Missing expected tables: ${testCase.expectedTables
        .filter((table) => !run.selectedTables.includes(table))
        .join(", ")}.`
    };
  }

  if (criterion === "sql_present" && testCase.expectedSqlRequired && run.generatedSql.length === 0) {
    return {
      criterion,
      mode: "sql_validation_failed",
      reason: "Expected generated SQL, but no SQL was generated."
    };
  }

  if (criterion === "sql_valid" && run.generatedSql.length > 0 && hasSqlValidationError(run)) {
    return {
      criterion,
      mode: "sql_validation_failed",
      reason: "Generated SQL has one or more blocking validation errors."
    };
  }

  if (criterion === "execution_success" && testCase.expectedExecutionRequired) {
    if (run.executionResult.length === 0) {
      return {
        criterion,
        mode: "sql_execution_failed",
        reason: "Expected execution result, but SQL was not executed."
      };
    }

    if (hasExecutionError(run)) {
      return {
        criterion,
        mode: "sql_execution_failed",
        reason: "One or more SQL execution results contain errors."
      };
    }

    if (totalRows(run) === 0) {
      return {
        criterion,
        mode: "empty_result",
        reason: "Expected a non-empty execution result, but all result sets were empty."
      };
    }
  }

  if (criterion === "guardrail_match" && run.guardrailDecision !== testCase.expectedGuardrailDecision) {
    return {
      criterion,
      mode:
        testCase.expectedGuardrailDecision === "blocked" && run.guardrailDecision !== "blocked"
          ? "sensitive_request_not_blocked"
          : run.guardrailDecision === "blocked"
            ? "unexpected_guardrail"
            : "missing_guardrail",
      reason: `Expected guardrail ${testCase.expectedGuardrailDecision}, got ${run.guardrailDecision}.`
    };
  }

  if (criterion === "warning_coverage" && !warningIncludesAll(run.warnings, testCase.expectedWarnings)) {
    return {
      criterion,
      mode: "missing_warning",
      reason: `Missing expected warning text: ${testCase.expectedWarnings
        .filter((warning) => !run.warnings.join(" ").toLowerCase().includes(warning.toLowerCase()))
        .join(", ")}.`
    };
  }

  if (criterion === "answer_grounded" && !textIncludesAll(run.finalAnswer, testCase.expectedAnswerMustInclude)) {
    return {
      criterion,
      mode: "ungrounded_answer",
      reason: `Final answer is missing expected text: ${testCase.expectedAnswerMustInclude
        .filter((term) => !run.finalAnswer.toLowerCase().includes(term.toLowerCase()))
        .join(", ")}.`
    };
  }

  if (criterion === "trace_complete" && !hasCompleteTrace(run)) {
    return {
      criterion,
      mode: "trace_incomplete",
      reason: "Trace is missing one or more required lifecycle labels."
    };
  }

  if (
    criterion === "no_fake_execution" &&
    run.guardrailDecision === "blocked" &&
    (run.generatedSql.length > 0 || run.executionResult.length > 0)
  ) {
    return {
      criterion,
      mode: "sensitive_request_not_blocked",
      reason: "Blocked guardrail run must not generate or execute SQL."
    };
  }

  if (criterion === "no_select_star" && /\bselect\s+\*|\.\*/i.test(generatedSqlText(run))) {
    return {
      criterion,
      mode: "sql_validation_failed",
      reason: "Generated SQL contains SELECT *."
    };
  }

  if (criterion === "no_sensitive_sql" && /\b(customer_id|email|is_sensitive_masked)\b/i.test(generatedSqlText(run))) {
    return {
      criterion,
      mode: "sensitive_request_not_blocked",
      reason: "Generated SQL references sensitive user-level fields."
    };
  }

  if (criterion === "sql_validates_before_execution" && !validationBeforeExecution(run)) {
    return {
      criterion,
      mode: "trace_incomplete",
      reason: "Trace does not show SQL validation before execution."
    };
  }

  return undefined;
}

function statusFromFailures(testCase: EvaluationCase, run: AgentRun, failures: CriterionFailure[]): EvaluationCaseStatus {
  if (failures.length > 0) {
    return "failed";
  }

  if (testCase.expectedGuardrailDecision === "blocked" && run.guardrailDecision === "blocked") {
    return "blocked_expected";
  }

  if (run.guardrailDecision === "needs_review" || testCase.expectedGuardrailDecision === "needs_review") {
    return "needs_review";
  }

  return "passed";
}

function failureModeFromFailures(testCase: EvaluationCase, failures: CriterionFailure[]) {
  if (failures.length === 0) {
    return testCase.expectedGuardrailDecision === "blocked" ? "missing_guardrail" : "unknown";
  }

  return testCase.expectedFailureMode ?? failures[0].mode;
}

export function scoreEvaluationCase(testCase: EvaluationCase, run: AgentRun): EvaluationCaseResult {
  const failures = testCase.passCriteria
    .map((criterion) => evaluateCriterion(testCase, run, criterion))
    .filter((failure): failure is CriterionFailure => Boolean(failure));
  const passedCriteria = testCase.passCriteria.length - failures.length;
  const status = statusFromFailures(testCase, run, failures);

  return {
    caseId: testCase.caseId,
    status,
    score: Math.round((passedCriteria / Math.max(1, testCase.passCriteria.length)) * 100),
    userQuestion: testCase.userQuestion,
    expected: expectedFromCase(testCase),
    actual: actualFromRun(run),
    failureReasons: failures.map((failure) => failure.reason),
    agentRun: run,
    humanReviewRequired: status === "failed" || status === "needs_review",
    failureMode: failureModeFromFailures(testCase, failures),
    reviewStatus: "unreviewed"
  };
}

export function createErrorCaseResult(testCase: EvaluationCase, error: unknown): EvaluationCaseResult {
  const message = error instanceof Error ? error.message : "Unknown evaluation error.";

  return {
    caseId: testCase.caseId,
    status: "error",
    score: 0,
    userQuestion: testCase.userQuestion,
    expected: expectedFromCase(testCase),
    actual: {
      intent: "error",
      metrics: [],
      tables: [],
      guardrailDecision: "error",
      warnings: [],
      sqlCount: 0,
      executionCount: 0,
      rowCount: 0,
      traceLabels: []
    },
    failureReasons: [`runAgent failed: ${message}`],
    error: message,
    humanReviewRequired: true,
    failureMode: testCase.expectedFailureMode ?? "unknown",
    reviewStatus: "unreviewed"
  };
}
