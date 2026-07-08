import { syntheticOrders } from "../../data/syntheticEcommerce";
import { createHtmlReport } from "../../reporting/htmlReport";
import { DEFAULT_DEMO_QUESTION, routeIntent } from "../intentRouter";
import { executeSql } from "../sqlExecutor";
import { generateSql } from "../sqlGenerator";
import { validateSql } from "../sqlValidator";
import { appendTraceEvent, completeTrace, createTrace } from "../trace";
import type { DemoAnswer } from "../types";

export function runDemoWorkflow(question = DEFAULT_DEMO_QUESTION): DemoAnswer {
  let trace = createTrace(question);

  const intent = routeIntent(question);
  trace = appendTraceEvent(trace, "Intent routed", "Matched the question to a deterministic intent.", {
    confidence: intent.confidence,
    intentId: intent.id,
    matchedKeywords: intent.matchedKeywords
  });

  const sqlPlan = generateSql(intent);
  trace = appendTraceEvent(trace, "SQL generated", "Created a template SQL query from the intent catalog.", {
    intentId: sqlPlan.intentId,
    title: sqlPlan.title
  });

  const validation = validateSql(sqlPlan.sql);
  trace = appendTraceEvent(trace, "SQL validated", "Checked that the SQL is read-only and uses known schema fields.", {
    issueCount: validation.issues.length,
    valid: validation.isValid
  });

  const execution = executeSql(sqlPlan.sql, syntheticOrders, validation);
  trace = appendTraceEvent(trace, "SQL executed", "Ran the validated query in the browser against synthetic data.", {
    elapsedMs: execution.elapsedMs,
    rowCount: execution.rowCount
  });

  trace = appendTraceEvent(trace, "Chart selected", "Mapped query output to a deterministic chart specification.", {
    chartType: sqlPlan.chart.type,
    xKey: sqlPlan.chart.xKey,
    yKey: sqlPlan.chart.yKey
  });

  const reportHtml = createHtmlReport({
    question,
    intent,
    sqlPlan,
    validation,
    execution
  });

  trace = appendTraceEvent(trace, "Report drafted", "Generated an editable HTML report draft from the result.", {
    reportLength: reportHtml.length
  });

  return {
    question,
    intent,
    sqlPlan,
    validation,
    execution,
    trace: completeTrace(trace),
    reportHtml
  };
}

