import type {
  AgentRun,
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

function formatReportValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }

  return String(value);
}

function renderAgentResultTable(result: ExecutionResult) {
  if (result.columns.length === 0 || result.rows.length === 0) {
    return `<p class="empty-state">No result rows were returned.</p>`;
  }

  const headers = result.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const rows = result.rows
    .slice(0, 8)
    .map((row) => {
      const cells = result.columns
        .map((column) => `<td>${escapeHtml(formatReportValue(row[column]))}</td>`)
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table>
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderAgentSql(run: AgentRun) {
  if (run.generatedSql.length === 0) {
    return `<p class="empty-state">No SQL was generated for this request.</p>`;
  }

  return run.generatedSql
    .map(
      (statement) => `<section class="report-card">
        <h3>${escapeHtml(statement.title)}</h3>
        <pre>${escapeHtml(statement.sql)}</pre>
      </section>`
    )
    .join("");
}

function renderAgentExecution(run: AgentRun) {
  if (run.executionResult.length === 0) {
    return `<p class="empty-state">No SQL was executed for this request.</p>`;
  }

  return run.executionResult
    .map((result, index) => {
      const statementTitle = run.generatedSql[index]?.title ?? `Statement ${index + 1}`;

      return `<section class="report-card">
        <h3>${escapeHtml(statementTitle)}</h3>
        <p class="report-meta">${result.rowCount} rows in ${result.elapsedMs}ms</p>
        ${renderAgentResultTable(result)}
      </section>`;
    })
    .join("");
}

function renderAgentValidation(run: AgentRun) {
  if (run.validationResults.length === 0) {
    return `<p class="empty-state">No validation checks were needed because SQL generation was blocked.</p>`;
  }

  return `<table>
    <thead>
      <tr>
        <th>Check</th>
        <th>Severity</th>
        <th>Status</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      ${run.validationResults
        .map(
          (result) => `<tr>
            <td>${escapeHtml(result.id)}</td>
            <td>${escapeHtml(result.severity)}</td>
            <td>${result.passed ? "Passed" : "Failed"}</td>
            <td>${escapeHtml(result.message)}</td>
          </tr>`
        )
        .join("")}
    </tbody>
  </table>`;
}

function renderAgentTrace(run: AgentRun) {
  return run.traceSteps
    .map(
      (step) => `<li>
        <strong>${escapeHtml(step.label)}</strong>
        <span>${escapeHtml(step.status)}</span>
        <p>${escapeHtml(step.message)}</p>
      </li>`
    )
    .join("");
}

function renderWarnings(warnings: string[]) {
  if (warnings.length === 0) {
    return `<p class="empty-state">No warnings were attached to this answer.</p>`;
  }

  return `<ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>`;
}

export function createAgentRunHtmlReport(run: AgentRun) {
  const reportTitle = `BI Data Agent Report - ${run.intent.replaceAll("_", " ")}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(reportTitle)}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #f8fafc; color: #111827; font-family: Inter, Arial, sans-serif; line-height: 1.55; }
      main { max-width: 960px; margin: 0 auto; padding: 40px 24px 56px; }
      h1, h2, h3 { line-height: 1.15; margin: 0 0 12px; }
      h1 { font-size: 32px; }
      h2 { font-size: 21px; margin-top: 30px; }
      h3 { font-size: 16px; }
      p { margin: 0 0 12px; }
      table { border-collapse: collapse; width: 100%; margin-top: 12px; background: #ffffff; }
      th, td { border: 1px solid #dbe3ef; padding: 8px 10px; text-align: left; vertical-align: top; font-size: 13px; }
      th { background: #eef4ff; color: #1f2937; }
      pre { overflow-x: auto; white-space: pre-wrap; background: #0f172a; color: #dbeafe; border-radius: 8px; padding: 14px; font-size: 13px; }
      ul { margin-top: 8px; }
      .report-hero { border-bottom: 1px solid #dbe3ef; margin-bottom: 26px; padding-bottom: 22px; }
      .report-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0 8px; }
      .report-kpi, .report-card { border: 1px solid #dbe3ef; border-radius: 8px; background: #ffffff; padding: 14px; }
      .report-kpi span, .report-meta { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
      .report-kpi strong { display: block; margin-top: 4px; font-size: 18px; }
      .report-card { margin-bottom: 14px; }
      .empty-state { color: #64748b; font-style: italic; }
      .trace-list { list-style: none; padding: 0; }
      .trace-list li { border-left: 3px solid #2563eb; background: #ffffff; margin-bottom: 10px; padding: 10px 14px; }
      .trace-list span { display: inline-block; margin-left: 8px; color: #475569; font-size: 12px; text-transform: uppercase; }
      @media (max-width: 720px) { .report-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    </style>
  </head>
  <body>
    <main contenteditable="true">
      <section class="report-hero">
        <h1>BI Data Agent Report</h1>
        <p><strong>Question:</strong> ${escapeHtml(run.userQuestion)}</p>
        <p><strong>Answer:</strong> ${escapeHtml(run.finalAnswer)}</p>
        <div class="report-kpis">
          <div class="report-kpi"><span>Intent</span><strong>${escapeHtml(run.intent.replaceAll("_", " "))}</strong></div>
          <div class="report-kpi"><span>Guardrail</span><strong>${escapeHtml(run.guardrailDecision)}</strong></div>
          <div class="report-kpi"><span>SQL</span><strong>${run.generatedSql.length}</strong></div>
          <div class="report-kpi"><span>Trace</span><strong>${run.traceSteps.length} steps</strong></div>
        </div>
        <p class="report-meta">Run id: ${escapeHtml(run.runId)} | Created: ${escapeHtml(run.createdAt)}</p>
      </section>

      <h2>Warnings</h2>
      ${renderWarnings(run.warnings)}

      <h2>Validated SQL</h2>
      ${renderAgentSql(run)}

      <h2>Validation Results</h2>
      ${renderAgentValidation(run)}

      <h2>Executed Results</h2>
      ${renderAgentExecution(run)}

      <h2>Trace</h2>
      <ol class="trace-list">${renderAgentTrace(run)}</ol>
    </main>
  </body>
</html>`;
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
