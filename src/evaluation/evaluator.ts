import { routeIntent } from "../agent/intentRouter";
import { executeSql } from "../agent/sqlExecutor";
import { generateSql } from "../agent/sqlGenerator";
import { validateSql } from "../agent/sqlValidator";
import { evaluationTestset, type EvaluationCase } from "./testset";

export interface EvaluationCaseResult {
  caseId: string;
  question: string;
  expectedIntent: string;
  actualIntent: string;
  passed: boolean;
  notes: string[];
}

export interface EvaluationSummary {
  total: number;
  passed: number;
  passRate: number;
  results: EvaluationCaseResult[];
}

export function evaluateCase(testCase: EvaluationCase): EvaluationCaseResult {
  const intent = routeIntent(testCase.question);
  const sqlPlan = generateSql(intent);
  const validation = validateSql(sqlPlan.sql);
  const execution = validation.isValid
    ? executeSql(sqlPlan.sql, undefined, validation)
    : undefined;

  const notes: string[] = [];

  if (intent.id !== testCase.expectedIntent) {
    notes.push(`Expected ${testCase.expectedIntent}, got ${intent.id}.`);
  }

  if (!validation.isValid) {
    notes.push("Generated SQL did not pass validation.");
  }

  if (execution && execution.rowCount < testCase.minRows) {
    notes.push(`Expected at least ${testCase.minRows} rows, got ${execution.rowCount}.`);
  }

  return {
    caseId: testCase.id,
    question: testCase.question,
    expectedIntent: testCase.expectedIntent,
    actualIntent: intent.id,
    passed: notes.length === 0,
    notes
  };
}

export function runEvaluationSuite(
  testset = evaluationTestset
): EvaluationSummary {
  const results = testset.map(evaluateCase);
  const passed = results.filter((result) => result.passed).length;

  return {
    total: results.length,
    passed,
    passRate: results.length === 0 ? 0 : passed / results.length,
    results
  };
}

