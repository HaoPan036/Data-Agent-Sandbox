import { describe, expect, it } from "vitest";
import { runEvaluation } from "./evaluator";
import { getEvaluationTestset } from "./testset";

describe("runEvaluation", () => {
  it("executes all cases through the real agent path", () => {
    const result = runEvaluation("core-regression");

    expect(result.summary.totalCases).toBe(getEvaluationTestset("core-regression").cases.length);
    expect(result.caseResults).toHaveLength(result.summary.totalCases);
    expect(result.caseResults.every((caseResult) => caseResult.agentRun ?? caseResult.error)).toBe(true);
  });

  it("returns a complete summary", () => {
    const result = runEvaluation("governance-regression");

    expect(result.summary.totalCases).toBeGreaterThanOrEqual(8);
    expect(result.summary.passedCases).toBeGreaterThanOrEqual(0);
    expect(result.summary.failedCases).toBeGreaterThanOrEqual(0);
    expect(result.summary.needsReviewCases).toBeGreaterThanOrEqual(0);
    expect(result.summary.blockedCases).toBeGreaterThanOrEqual(0);
    expect(result.summary.failureModeCounts).toHaveProperty("sensitive_request_not_blocked");
  });

  it("calculates pass rate from passed and expected-blocked cases", () => {
    const result = runEvaluation("core-regression");
    const expectedPassRate =
      (result.summary.passedCases + result.summary.blockedCases) / result.summary.totalCases;

    expect(result.summary.passRate).toBe(expectedPassRate);
  });

  it("passes the sensitive export blocked case", () => {
    const result = runEvaluation("core-regression");
    const sensitiveCase = result.caseResults.find((caseResult) => caseResult.caseId === "core-011-sensitive-export");

    expect(sensitiveCase?.status).toBe("blocked_expected");
    expect(sensitiveCase?.actual.guardrailDecision).toBe("blocked");
    expect(sensitiveCase?.agentRun?.generatedSql).toHaveLength(0);
  });

  it("does not crash on unsupported questions", () => {
    const result = runEvaluation("core-regression");
    const unsupportedCase = result.caseResults.find((caseResult) => caseResult.caseId === "core-013-unsupported");

    expect(unsupportedCase?.status).not.toBe("error");
    expect(unsupportedCase?.agentRun?.intent).toBe("unknown");
  });

  it("produces failure reasons for failed criteria", () => {
    const result = runEvaluation("core-regression");
    const ambiguityCase = result.caseResults.find((caseResult) => caseResult.caseId === "core-014-ambiguity");

    expect(ambiguityCase?.status).toBe("failed");
    expect(ambiguityCase?.failureMode).toBe("metric_mismatch");
    expect(ambiguityCase?.failureReasons.length).toBeGreaterThan(0);
  });

  it("calculates failure mode counts", () => {
    const result = runEvaluation("core-regression");

    expect(result.summary.failureModeCounts.metric_mismatch).toBeGreaterThan(0);
  });
});
