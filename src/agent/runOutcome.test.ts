import { describe, expect, it } from "vitest";
import { runAgent } from "./runAgent";
import { deriveRunOutcome } from "./runOutcome";
import type { AgentRun } from "./types";

const sensitiveQuestion = "Export all customer emails and rank risky users.";
const supportedQuestion = "What was total revenue last week?";

function failedReviewRun(): AgentRun {
  const run = runAgent(supportedQuestion, "retail-growth-demo");
  const validation = run.validationResults[0];

  if (!validation) {
    throw new Error("Expected a validation fixture.");
  }

  return {
    ...run,
    chartSpec: undefined,
    executionResult: [],
    finalAnswer: "SQL validation stopped execution. Review the validation details.",
    guardrailDecision: "needs_review",
    status: "failed",
    validationResults: [
      {
        ...validation,
        message: "SQL validation stopped execution.",
        passed: false,
        severity: "error"
      }
    ]
  };
}

describe("deriveRunOutcome", () => {
  it("recognizes a blocked run only when every execution artifact is absent", () => {
    const run = runAgent(sensitiveQuestion, "retail-growth-demo");

    expect(deriveRunOutcome(run)).toMatchObject({
      chartDataRowCount: 0,
      executionResultSetCount: 0,
      guardrailTone: "red",
      hasExecutionArtifacts: false,
      hasOutcomeIntegrityMismatch: false,
      isSafelyBlocked: true,
      needsOutcomeReview: false,
      noSqlOutcome: "safely_blocked",
      sqlStatementCount: 0
    });
  });

  it("records every integrity fact for a complete allowed run", () => {
    const outcome = deriveRunOutcome(runAgent(supportedQuestion, "retail-growth-demo"));

    expect(outcome).toMatchObject({
      allValidationChecksPassed: true,
      hasChartSpec: true,
      hasExecutionErrors: false,
      hasNonEmptySql: true,
      hasOutcomeIntegrityMismatch: false,
      hasSuccessfulRunCompletenessMismatch: false,
      hasValidationChecks: true,
      isSuccessfulAllowedRun: true,
      sqlResultSetCountsMatch: true
    });
  });

  it("flags blocked runs that contain execution results", () => {
    const run = runAgent(sensitiveQuestion, "retail-growth-demo");
    const outcome = deriveRunOutcome({
      ...run,
      executionResult: [
        {
          columns: ["customer_email"],
          elapsedMs: 1,
          rowCount: 1,
          rows: [{ customer_email: "synthetic@example.test" }]
        }
      ]
    });

    expect(outcome).toMatchObject({
      executionResultSetCount: 1,
      executionRowCount: 1,
      hasBlockedArtifactMismatch: true,
      hasExecutionWithoutSql: true,
      hasOutcomeIntegrityMismatch: true,
      hasResultsWithoutSql: true,
      isSafelyBlocked: false,
      needsOutcomeReview: true,
      noSqlOutcome: "integrity_mismatch"
    });
  });

  it.each([
    ["validation checks", (run: AgentRun) => ({ ...run, validationResults: [] })],
    ["execution results", (run: AgentRun) => ({ ...run, executionResult: [] })],
    ["chart spec", (run: AgentRun) => ({ ...run, chartSpec: undefined })]
  ] as const)("flags an allowed successful run missing %s", (_label, mutate) => {
    const outcome = deriveRunOutcome(mutate(runAgent(supportedQuestion, "retail-growth-demo")));

    expect(outcome.hasSuccessfulRunCompletenessMismatch).toBe(true);
    expect(outcome.hasOutcomeIntegrityMismatch).toBe(true);
    expect(outcome.needsOutcomeReview).toBe(true);
  });

  it("flags impossible result metadata and chart data without results", () => {
    const run = runAgent(supportedQuestion, "retail-growth-demo");
    const result = run.executionResult[0];

    if (!result || !run.chartSpec) {
      throw new Error("Expected execution and chart fixtures.");
    }

    const metadataMismatch = deriveRunOutcome({
      ...run,
      executionResult: [{ ...result, isEmpty: true }]
    });
    const chartWithoutResults = deriveRunOutcome({ ...run, executionResult: [] });

    expect(metadataMismatch.hasResultMetadataMismatch).toBe(true);
    expect(metadataMismatch.hasOutcomeIntegrityMismatch).toBe(true);
    expect(chartWithoutResults.hasChartDataWithoutResults).toBe(true);
    expect(chartWithoutResults.hasOutcomeIntegrityMismatch).toBe(true);
  });

  it("accepts a no-SQL needs-review run and a partial failed needs-review run", () => {
    const blocked = runAgent(sensitiveQuestion, "retail-growth-demo");
    const noSqlReview: AgentRun = {
      ...blocked,
      finalAnswer: "No deterministic SQL template matched this question.",
      guardrailDecision: "needs_review",
      intent: "unknown",
      status: "completed"
    };
    const reviewOutcome = deriveRunOutcome(noSqlReview);
    const failureOutcome = deriveRunOutcome(failedReviewRun());

    expect(reviewOutcome).toMatchObject({
      hasOutcomeIntegrityMismatch: false,
      noSqlOutcome: "needs_review",
      needsOutcomeReview: true
    });
    expect(failureOutcome).toMatchObject({
      hasOutcomeIntegrityMismatch: false,
      hasSuccessfulRunCompletenessMismatch: false,
      needsOutcomeReview: true
    });
  });
});
