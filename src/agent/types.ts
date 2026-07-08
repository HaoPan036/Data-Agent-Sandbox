export type SupportedIntentId =
  | "monthly_revenue_trend"
  | "regional_revenue"
  | "top_categories"
  | "profit_by_channel";

export type ChartType = "line" | "bar";
export type ColumnType = "string" | "number" | "boolean";
export type TimeGrain = "day" | "week" | "month";
export type SensitivityLevel = "public" | "masked" | "sensitive";

export interface QuestionIntent {
  id: SupportedIntentId;
  label: string;
  confidence: number;
  matchedKeywords: string[];
  normalizedQuestion: string;
}

export interface MetricDefinition {
  id: string;
  displayName: string;
  description: string;
  formula: string;
  sourceTables: string[];
  requiredColumns: Record<string, string[]>;
  allowedDimensions: string[];
  defaultTimeGrain: TimeGrain;
  caveats: string[];
  sensitivityLevel: SensitivityLevel;
}

export interface TableColumn {
  name: string;
  type: ColumnType;
  description: string;
}

export interface AllowedJoin {
  tableName: string;
  on: string;
  relationship: "many-to-one" | "one-to-many" | "one-to-one";
}

export interface DatasetSchema {
  tableName: string;
  displayName: string;
  description: string;
  grain: string;
  defaultDateColumn: string;
  columns: TableColumn[];
  columnTypes: Record<string, ColumnType>;
  allowedJoins: AllowedJoin[];
  sensitiveColumns: string[];
  sampleQuestions: string[];
}

export interface ChartSpec {
  type: ChartType;
  xKey: string;
  yKey: string;
  yLabel: string;
}

export interface SqlPlan {
  intentId: SupportedIntentId;
  title: string;
  sql: string;
  chart: ChartSpec;
  rationale: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  normalizedSql: string;
}

export type QueryValue = string | number | boolean | null;

export type QueryRow = Record<string, QueryValue>;

export interface ExecutionResult {
  columns: string[];
  rows: QueryRow[];
  rowCount: number;
  elapsedMs: number;
  isEmpty?: boolean;
  error?: string;
}

export interface AgentTraceEvent {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  elapsedMs: number;
  metadata?: Record<string, QueryValue | QueryValue[]>;
}

export interface AgentTrace {
  question: string;
  startedAt: string;
  completedAt?: string;
  totalElapsedMs?: number;
  events: AgentTraceEvent[];
}

export interface DemoAnswer {
  question: string;
  intent: QuestionIntent;
  sqlPlan: SqlPlan;
  validation: ValidationResult;
  execution: ExecutionResult;
  trace: AgentTrace;
  reportHtml: string;
}

export type AgentIntent =
  | "metric_lookup"
  | "metric_comparison"
  | "trend_analysis"
  | "diagnostic_analysis"
  | "campaign_review"
  | "experiment_analysis"
  | "data_completeness_check"
  | "governance_sensitive_request"
  | "unknown";

export type AgentRunStatus = "idle" | "running" | "completed" | "blocked" | "failed";
export type ValidationSeverity = "info" | "warning" | "error";
export type GuardrailDecision = "allowed" | "blocked" | "needs_review";
export type AgentTraceStepStatus = "completed" | "blocked" | "failed" | "warning";

export interface AgentTraceStep {
  id: string;
  label: string;
  status: AgentTraceStepStatus;
  message: string;
  details?: Record<string, QueryValue | QueryValue[] | string[] | number[] | boolean[]>;
  timestamp: string;
}

export interface AgentSqlStatement {
  id: string;
  title: string;
  sql: string;
}

export interface AgentSqlPlan {
  statements: AgentSqlStatement[];
  selectedMetrics: string[];
  selectedTables: string[];
  warnings: string[];
  suggestedFollowUps: string[];
}

export interface AgentValidationResult {
  id: string;
  severity: ValidationSeverity;
  message: string;
  passed: boolean;
  details?: Record<string, QueryValue | QueryValue[] | string[]>;
}

export interface AgentChartSpec {
  type: "kpi" | "bar" | "line" | "table" | "status";
  title: string;
  xKey: string;
  yKeys: string[];
  seriesKey?: string;
  data: QueryRow[];
}

export interface AgentRun {
  runId: string;
  status: AgentRunStatus;
  topicId: string;
  userQuestion: string;
  intent: AgentIntent;
  selectedMetrics: string[];
  selectedTables: string[];
  generatedSql: AgentSqlStatement[];
  validationResults: AgentValidationResult[];
  executionResult: ExecutionResult[];
  chartSpec?: AgentChartSpec;
  traceSteps: AgentTraceStep[];
  warnings: string[];
  guardrailDecision: GuardrailDecision;
  finalAnswer: string;
  suggestedFollowUps: string[];
  createdAt: string;
}

export interface AgentRunOptions {
  runId?: string;
  createdAt?: string;
}
