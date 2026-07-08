import type { AgentChartSpec, AgentIntent, ExecutionResult, QueryRow } from "./types";

function resultRows(executionResult: ExecutionResult[], index = 0) {
  return executionResult[index]?.rows ?? [];
}

function mergeRows(executionResult: ExecutionResult[]) {
  return executionResult.flatMap((result) => result.rows);
}

export function buildChartSpec(intent: AgentIntent, executionResult: ExecutionResult[]): AgentChartSpec | undefined {
  if (executionResult.some((result) => result.error) || executionResult.length === 0) {
    return undefined;
  }

  if (intent === "metric_lookup") {
    return {
      type: "kpi",
      title: "Total revenue last complete week",
      xKey: "metric",
      yKeys: ["revenue", "orders", "average_order_value"],
      data: resultRows(executionResult)
    };
  }

  if (intent === "metric_comparison") {
    return {
      type: "bar",
      title: "Refund rate by category",
      xKey: "category",
      yKeys: ["refund_rate"],
      data: resultRows(executionResult)
    };
  }

  if (intent === "trend_analysis") {
    const rows = resultRows(executionResult);
    const hasRegionSeries = rows.some((row) => typeof row.region === "string");

    return {
      type: "line",
      title: hasRegionSeries ? "Weekly revenue by region" : "Daily GMV and active users",
      xKey: hasRegionSeries ? "order_week" : "event_date",
      yKeys: hasRegionSeries ? ["revenue"] : ["gmv", "active_users"],
      seriesKey: hasRegionSeries ? "region" : undefined,
      data: rows
    };
  }

  if (intent === "diagnostic_analysis") {
    return {
      type: "bar",
      title: "Revenue change by region",
      xKey: "region",
      yKeys: ["revenue_change"],
      data: resultRows(executionResult, 1)
    };
  }

  if (intent === "campaign_review") {
    return {
      type: "bar",
      title: "Campaign period vs previous baseline",
      xKey: "period_label",
      yKeys: ["revenue"],
      data: mergeRows(executionResult)
    };
  }

  if (intent === "experiment_analysis") {
    const rows = resultRows(executionResult);
    const sample = rows[0] as QueryRow | undefined;
    const yKey = sample?.conversion_rate
      ? "conversion_rate"
      : sample?.checkout_abandonment_rate
        ? "checkout_abandonment_rate"
        : "revenue_per_session";

    return {
      type: "bar",
      title: "Experiment comparison",
      xKey: sample?.region ? "region" : "variant",
      yKeys: [yKey],
      data: rows
    };
  }

  if (intent === "data_completeness_check") {
    return {
      type: "status",
      title: "Latest week completeness",
      xKey: "range_start",
      yKeys: ["available_days", "expected_days"],
      data: resultRows(executionResult)
    };
  }

  return undefined;
}
