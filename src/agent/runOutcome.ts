import type { AgentRun, GuardrailDecision } from "./types.js";

export type GuardrailTone = "green" | "amber" | "red";
export type NoSqlOutcome =
  | "not_applicable"
  | "safely_blocked"
  | "integrity_mismatch"
  | "needs_review"
  | "neutral";

export interface RunOutcomeFacts {
  allValidationChecksPassed: boolean;
  chartDataRowCount: number;
  executionResultSetCount: number;
  executionRowCount: number;
  guardrailTone: GuardrailTone;
  hasBlockedArtifactMismatch: boolean;
  hasBlockedSignalMismatch: boolean;
  hasChartData: boolean;
  hasChartDataWithoutResults: boolean;
  hasChartSpec: boolean;
  hasExecutionArtifacts: boolean;
  hasExecutionErrors: boolean;
  hasExecutionResults: boolean;
  hasExecutionWithoutSql: boolean;
  hasGeneratedSql: boolean;
  hasInvalidSqlStatement: boolean;
  hasNonEmptySql: boolean;
  isBlockedDecision: boolean;
  isBlockedStatus: boolean;
  isSafelyBlocked: boolean;
  hasOutcomeIntegrityMismatch: boolean;
  hasResultMetadataMismatch: boolean;
  hasResultsWithoutSql: boolean;
  hasSuccessfulRunCompletenessMismatch: boolean;
  hasValidationChecks: boolean;
  isSuccessfulAllowedRun: boolean;
  needsOutcomeReview: boolean;
  noSqlOutcome: NoSqlOutcome;
  sqlResultSetCountsMatch: boolean;
  sqlStatementCount: number;
}

function guardrailTone(decision: GuardrailDecision): GuardrailTone {
  if (decision === "allowed") {
    return "green";
  }

  return decision === "blocked" ? "red" : "amber";
}

export function deriveRunOutcome(run: AgentRun): RunOutcomeFacts {
  const sqlStatementCount = run.generatedSql.length;
  const executionResultSetCount = run.executionResult.length;
  const executionRowCount = run.executionResult.reduce(
    (total, result) => total + result.rowCount,
    0
  );
  const chartDataRowCount = run.chartSpec?.data.length ?? 0;
  const hasGeneratedSql = sqlStatementCount > 0;
  const hasInvalidSqlStatement = run.generatedSql.some(
    (statement) => statement.sql.trim().length === 0
  );
  const hasNonEmptySql = hasGeneratedSql && !hasInvalidSqlStatement;
  const hasExecutionResults = executionResultSetCount > 0;
  const hasExecutionErrors = run.executionResult.some((result) => Boolean(result.error));
  const hasResultMetadataMismatch = run.executionResult.some(
    (result) =>
      result.rowCount !== result.rows.length ||
      (result.isEmpty !== undefined && result.isEmpty !== (result.rowCount === 0))
  );
  const hasChartSpec = run.chartSpec !== undefined;
  const hasChartData = chartDataRowCount > 0;
  const hasExecutionArtifacts = hasGeneratedSql || hasExecutionResults || hasChartSpec;
  const hasValidationChecks = run.validationResults.length > 0;
  const allValidationChecksPassed =
    hasValidationChecks && run.validationResults.every((result) => result.passed);
  const sqlResultSetCountsMatch = sqlStatementCount === executionResultSetCount;
  const isBlockedStatus = run.status === "blocked";
  const isBlockedDecision = run.guardrailDecision === "blocked";
  const hasBlockedSignalMismatch = isBlockedStatus !== isBlockedDecision;
  const hasBlockedArtifactMismatch =
    (isBlockedStatus || isBlockedDecision) && hasExecutionArtifacts;
  const hasResultsWithoutSql = !hasGeneratedSql && hasExecutionResults;
  const hasChartDataWithoutResults = hasChartData && !hasExecutionResults;
  const hasExecutionWithoutSql = hasResultsWithoutSql || (!hasGeneratedSql && hasChartData);
  const isSafelyBlocked =
    isBlockedStatus &&
    isBlockedDecision &&
    !hasExecutionArtifacts;
  const isSuccessfulAllowedRun =
    run.status === "completed" && run.guardrailDecision === "allowed";
  const hasSuccessfulRunCompletenessMismatch =
    isSuccessfulAllowedRun &&
    (!hasNonEmptySql ||
      !hasValidationChecks ||
      !allValidationChecksPassed ||
      !sqlResultSetCountsMatch ||
      hasExecutionErrors ||
      !hasChartSpec);
  const hasOutcomeIntegrityMismatch =
    hasBlockedSignalMismatch ||
    hasBlockedArtifactMismatch ||
    hasInvalidSqlStatement ||
    hasResultMetadataMismatch ||
    hasResultsWithoutSql ||
    hasChartDataWithoutResults ||
    hasSuccessfulRunCompletenessMismatch;
  const needsOutcomeReview =
    run.guardrailDecision === "needs_review" || hasOutcomeIntegrityMismatch;
  const noSqlOutcome: NoSqlOutcome = hasGeneratedSql
    ? "not_applicable"
    : isSafelyBlocked
      ? "safely_blocked"
      : hasOutcomeIntegrityMismatch
        ? "integrity_mismatch"
        : run.guardrailDecision === "needs_review"
          ? "needs_review"
          : "neutral";

  return {
    allValidationChecksPassed,
    chartDataRowCount,
    executionResultSetCount,
    executionRowCount,
    guardrailTone: guardrailTone(run.guardrailDecision),
    hasBlockedArtifactMismatch,
    hasBlockedSignalMismatch,
    hasChartData,
    hasChartDataWithoutResults,
    hasChartSpec,
    hasExecutionArtifacts,
    hasExecutionErrors,
    hasExecutionResults,
    hasExecutionWithoutSql,
    hasGeneratedSql,
    hasInvalidSqlStatement,
    hasNonEmptySql,
    isBlockedDecision,
    isBlockedStatus,
    isSafelyBlocked,
    hasOutcomeIntegrityMismatch,
    hasResultMetadataMismatch,
    hasResultsWithoutSql,
    hasSuccessfulRunCompletenessMismatch,
    hasValidationChecks,
    isSuccessfulAllowedRun,
    needsOutcomeReview,
    noSqlOutcome,
    sqlResultSetCountsMatch,
    sqlStatementCount
  };
}
