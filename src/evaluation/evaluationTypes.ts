import type { AgentIntent, AgentRun, GuardrailDecision } from "../agent/types";

export type EvaluationCaseStatus =
  | "passed"
  | "failed"
  | "needs_review"
  | "blocked_expected"
  | "error";

export type FailureModeLabel =
  | "intent_mismatch"
  | "metric_mismatch"
  | "table_mismatch"
  | "sql_validation_failed"
  | "sql_execution_failed"
  | "missing_warning"
  | "missing_guardrail"
  | "unexpected_guardrail"
  | "ungrounded_answer"
  | "empty_result"
  | "unsupported_question"
  | "sensitive_request_not_blocked"
  | "trace_incomplete"
  | "unknown";

export type EvaluationSeverity = "low" | "medium" | "high" | "critical";

export type PassCriterion =
  | "intent_match"
  | "metric_coverage"
  | "table_coverage"
  | "sql_present"
  | "sql_valid"
  | "execution_success"
  | "guardrail_match"
  | "warning_coverage"
  | "answer_grounded"
  | "trace_complete"
  | "no_fake_execution"
  | "no_select_star"
  | "no_sensitive_sql"
  | "sql_validates_before_execution";

export interface EvaluationTestset {
  id: string;
  name: string;
  version: string;
  description: string;
  createdAt: string;
  cases: EvaluationCase[];
}

export interface EvaluationCase {
  caseId: string;
  title: string;
  topicId: string;
  userQuestion: string;
  expectedIntent: AgentIntent;
  expectedMetrics: string[];
  expectedTables: string[];
  expectedGuardrailDecision: GuardrailDecision;
  expectedWarnings: string[];
  expectedSqlRequired: boolean;
  expectedExecutionRequired: boolean;
  expectedAnswerMustInclude: string[];
  expectedFailureMode?: FailureModeLabel;
  passCriteria: PassCriterion[];
  severity: EvaluationSeverity;
}

export interface EvaluationCaseExpected {
  intent: AgentIntent;
  metrics: string[];
  tables: string[];
  guardrailDecision: GuardrailDecision;
  warnings: string[];
  sqlRequired: boolean;
  executionRequired: boolean;
  answerMustInclude: string[];
}

export interface EvaluationCaseActual {
  intent: AgentIntent | "error";
  metrics: string[];
  tables: string[];
  guardrailDecision: GuardrailDecision | "error";
  warnings: string[];
  sqlCount: number;
  executionCount: number;
  rowCount: number;
  traceLabels: string[];
}

export interface EvaluationResult {
  testsetId: string;
  testsetVersion: string;
  runId: string;
  startedAt: string;
  completedAt: string;
  summary: EvaluationSummary;
  caseResults: EvaluationCaseResult[];
}

export interface EvaluationSummary {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  needsReviewCases: number;
  blockedCases: number;
  passRate: number;
  failureModeCounts: Record<FailureModeLabel, number>;
}

export interface EvaluationCaseResult {
  caseId: string;
  status: EvaluationCaseStatus;
  score: number;
  userQuestion: string;
  expected: EvaluationCaseExpected;
  actual: EvaluationCaseActual;
  failureReasons: string[];
  agentRun?: AgentRun;
  error?: string;
  humanReviewRequired: boolean;
  failureMode: FailureModeLabel;
  reviewStatus: "unreviewed" | "reviewed";
}
