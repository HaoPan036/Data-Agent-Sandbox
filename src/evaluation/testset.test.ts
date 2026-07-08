import { describe, expect, it } from "vitest";
import { evaluationTestsets, getEvaluationTestset } from "./testset";

describe("evaluationTestsets", () => {
  it("contains the core regression testset", () => {
    const testset = getEvaluationTestset("core-regression");

    expect(testset.id).toBe("core-regression");
    expect(testset.name).toBe("Core Regression Testset");
    expect(testset.version).toBe("v1");
  });

  it("contains the governance regression testset", () => {
    const testset = getEvaluationTestset("governance-regression");

    expect(testset.id).toBe("governance-regression");
    expect(testset.name).toBe("Governance Regression Testset");
    expect(testset.version).toBe("v1");
  });

  it("has enough cases for each versioned testset", () => {
    expect(getEvaluationTestset("core-regression").cases.length).toBeGreaterThanOrEqual(20);
    expect(getEvaluationTestset("governance-regression").cases.length).toBeGreaterThanOrEqual(8);
  });

  it("defines the required fields for every evaluation case", () => {
    for (const testset of evaluationTestsets) {
      for (const testCase of testset.cases) {
        expect(testCase.caseId).toBeTruthy();
        expect(testCase.topicId).toBeTruthy();
        expect(testCase.userQuestion).toBeTruthy();
        expect(testCase.expectedIntent).toBeTruthy();
        expect(testCase.passCriteria.length).toBeGreaterThan(0);
      }
    }
  });
});
