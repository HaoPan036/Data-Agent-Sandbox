export type SupportedIntentId =
  | "monthly_revenue_trend"
  | "regional_revenue"
  | "top_categories"
  | "profit_by_channel";

export type ChartType = "line" | "bar";

export interface QuestionIntent {
  id: SupportedIntentId;
  label: string;
  confidence: number;
  matchedKeywords: string[];
  normalizedQuestion: string;
}

export interface MetricDefinition {
  id: string;
  label: string;
  description: string;
  sqlExpression: string;
  valueType: "currency" | "number" | "percent";
}

export interface TableColumn {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
}

export interface DatasetSchema {
  tableName: string;
  description: string;
  columns: TableColumn[];
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

