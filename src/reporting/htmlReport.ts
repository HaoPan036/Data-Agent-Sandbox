import type {
  ExecutionResult,
  QuestionIntent,
  SqlPlan,
  ValidationResult
} from "../agent/types";
import { formatCurrency, formatPercent } from "../utils/format";

interface ReportInput {
  question: string;
  intent: QuestionIntent;
  sqlPlan: SqlPlan;
  validation: ValidationResult;
  execution: ExecutionResult;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRows(execution: ExecutionResult) {
  const rows = execution.rows.slice(0, 8);

  return rows
    .map((row) => {
      const cells = execution.columns
        .map((column) => `<td>${escapeHtml(String(row[column] ?? ""))}</td>`)
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");
}

export function createHtmlReport(input: ReportInput) {
  const firstRow = input.execution.rows[0];
  const metricKey = input.sqlPlan.chart.yKey;
  const metricValue =
    typeof firstRow?.[metricKey] === "number" ? Number(firstRow[metricKey]) : 0;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.sqlPlan.title)}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; line-height: 1.5; color: #1f2937; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
      th { background: #f3f4f6; }
      code, pre { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(input.sqlPlan.title)}</h1>
    <p><strong>Question:</strong> ${escapeHtml(input.question)}</p>
    <p><strong>Intent:</strong> ${escapeHtml(input.intent.label)} (${formatPercent(input.intent.confidence)})</p>
    <p><strong>Top result:</strong> ${formatCurrency(metricValue)}</p>
    <h2>Validated SQL</h2>
    <pre>${escapeHtml(input.validation.normalizedSql)}</pre>
    <h2>Result sample</h2>
    <table>
      <thead>
        <tr>${input.execution.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>${renderRows(input.execution)}</tbody>
    </table>
  </body>
</html>`;
}

