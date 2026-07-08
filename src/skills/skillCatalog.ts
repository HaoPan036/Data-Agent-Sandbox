import type { SkillDefinition } from "./skillTypes";

export const skillCatalog: SkillDefinition[] = [
  {
    id: "intent-routing",
    name: "Intent routing",
    description:
      "Maps a business question to one of the supported deterministic BI intents.",
    status: "ready",
    input: "Natural language question",
    output: "Intent id, label, confidence, matched keywords"
  },
  {
    id: "sql-generation",
    name: "SQL generation",
    description:
      "Uses a cataloged template to produce read-only SQL for the selected intent.",
    status: "ready",
    input: "Intent id",
    output: "SQL plan, rationale, chart spec"
  },
  {
    id: "sql-validation",
    name: "SQL validation",
    description:
      "Blocks write operations, unknown fields, comments, and multi-statement SQL.",
    status: "ready",
    input: "SQL string",
    output: "Validation result and issues"
  },
  {
    id: "browser-sql-execution",
    name: "Browser SQL execution",
    description:
      "Executes validated SQL locally against synthetic data with AlaSQL.",
    status: "ready",
    input: "Validated SQL plus synthetic rows",
    output: "Columns, rows, row count, elapsed time"
  },
  {
    id: "evaluation",
    name: "Evaluation",
    description:
      "Runs deterministic test questions and checks intent, validation, and row-count expectations.",
    status: "ready",
    input: "Evaluation testset",
    output: "Pass rate and per-case results"
  },
  {
    id: "reporting",
    name: "Editable report draft",
    description:
      "Creates an HTML report draft that can be edited in the browser.",
    status: "ready",
    input: "Question, SQL plan, validation, result rows",
    output: "HTML report"
  },
  {
    id: "optional-llm",
    name: "Optional LLM integration",
    description:
      "Future adapter for API-key-based model assistance. The first version does not require it.",
    status: "planned",
    input: "Provider configuration",
    output: "Model-assisted intent or explanation"
  }
];

