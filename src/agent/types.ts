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

