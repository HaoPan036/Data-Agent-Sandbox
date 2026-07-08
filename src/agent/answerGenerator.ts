import type { AgentIntent, ExecutionResult, GuardrailDecision, QueryRow } from "./types";

function numberValue(row: QueryRow | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function stringValue(row: QueryRow | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "string" ? value : String(value ?? "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    style: "percent"
  }).format(value);
}

function hasExecutionError(executionResult: ExecutionResult[]) {
  return executionResult.find((result) => result.error);
}

function firstRow(executionResult: ExecutionResult[], index = 0) {
  return executionResult[index]?.rows[0];
}

export function generateBlockedAnswer() {
  return [
    "Blocked by guardrails. This sandbox does not export customer emails, rank risky users, or select user-level customer records.",
    "A safe alternative is to ask for aggregated, public-demo metrics such as revenue by region, masked customer counts by segment, or sensitive-column policy details."
  ].join(" ");
}

export function generateUnknownAnswer() {
  return [
    "I could not match this question to a deterministic workflow in the public sandbox.",
    "Try one of the supported Retail Growth or Experiment Metrics sample questions, or use the Knowledge Base Demo as metadata-only context for now."
  ].join(" ");
}

export function generateGroundedAnswer(
  intent: AgentIntent,
  executionResult: ExecutionResult[],
  warnings: string[] = [],
  guardrailDecision: GuardrailDecision = "allowed"
) {
  if (guardrailDecision === "blocked") {
    return generateBlockedAnswer();
  }

  if (intent === "unknown") {
    return generateUnknownAnswer();
  }

  const executionError = hasExecutionError(executionResult);

  if (executionError) {
    return `SQL execution failed: ${executionError.error}`;
  }

  if (executionResult.length === 0 || executionResult.every((result) => result.isEmpty || result.rowCount === 0)) {
    return "The validated SQL ran, but it returned no rows for this synthetic data window.";
  }

  if (intent === "metric_lookup") {
    const row = firstRow(executionResult);

    return `Total revenue for the last complete synthetic week was ${formatCurrency(
      numberValue(row, "revenue")
    )} across ${formatNumber(numberValue(row, "orders"))} orders, with average order value of ${formatCurrency(
      numberValue(row, "average_order_value")
    )}.`;
  }

  if (intent === "metric_comparison") {
    const row = firstRow(executionResult);

    return `${stringValue(row, "category")} had the highest refund rate last month at ${formatPercent(
      numberValue(row, "refund_rate")
    )}, based on ${formatNumber(numberValue(row, "refunded_orders"))} refunded orders out of ${formatNumber(
      numberValue(row, "orders")
    )} orders.`;
  }

  if (intent === "trend_analysis") {
    const rows = executionResult[0]?.rows ?? [];
    const latest = rows[rows.length - 1];

    if (latest?.gmv !== undefined) {
      return `The 30-day experiment trend returned ${formatNumber(rows.length)} daily rows. The latest synthetic day shows GMV of ${formatCurrency(
        numberValue(latest, "gmv")
      )} and ${formatNumber(numberValue(latest, "active_users"))} active users.`;
    }

    const totalRevenue = rows.reduce((sum, row) => sum + numberValue(row, "revenue"), 0);
    const weekCount = new Set(rows.map((row) => stringValue(row, "order_week"))).size;

    return `Weekly revenue by region returned ${formatNumber(rows.length)} grouped rows across ${formatNumber(
      weekCount
    )} synthetic weeks, totaling ${formatCurrency(totalRevenue)}.`;
  }

  if (intent === "diagnostic_analysis") {
    const summary = firstRow(executionResult);
    const region = firstRow(executionResult, 1);
    const category = firstRow(executionResult, 2);
    const change = numberValue(summary, "revenue_change");

    return [
      `Revenue changed by ${formatCurrency(change)} versus the previous comparable week.`,
      `The drop appears concentrated in ${stringValue(region, "region")} by region and ${stringValue(
        category,
        "category"
      )} by category based on the largest negative changes.`,
      "Possible drivers include lower synthetic traffic or mix effects in those segments; this is not a causal conclusion."
    ].join(" ");
  }

  if (intent === "campaign_review") {
    const campaign = firstRow(executionResult, 0);
    const baseline = firstRow(executionResult, 1);
    const campaignRevenue = numberValue(campaign, "revenue");
    const baselineRevenue = numberValue(baseline, "revenue");
    const delta = campaignRevenue - baselineRevenue;

    return `Campaign ${stringValue(campaign, "campaign_id")} generated ${formatCurrency(
      campaignRevenue
    )} during the campaign period versus ${formatCurrency(
      baselineRevenue
    )} in the previous baseline period, a difference of ${formatCurrency(
      delta
    )}. This comparison is descriptive and not a causal holdout result.`;
  }

  if (intent === "experiment_analysis") {
    const rows = executionResult[0]?.rows ?? [];
    const best = rows[0];

    if (best?.conversion_rate !== undefined) {
      return `${stringValue(best, "region")} had the highest regional conversion rate at ${formatPercent(
        numberValue(best, "conversion_rate")
      )} for the selected synthetic week. ${warnings[0] ?? ""}`.trim();
    }

    if (best?.checkout_abandonment_rate !== undefined) {
      return `${stringValue(best, "variant")} had the lower checkout abandonment rate at ${formatPercent(
        numberValue(best, "checkout_abandonment_rate")
      )}, based on ${formatNumber(numberValue(best, "checkout_started"))} checkout starts.`;
    }

    return `${stringValue(best, "variant")} had higher revenue per session at ${formatDecimal(
      numberValue(best, "revenue_per_session")
    )}, with GMV of ${formatCurrency(numberValue(best, "gmv"))} over ${formatNumber(
      numberValue(best, "sessions")
    )} sessions.`;
  }

  if (intent === "data_completeness_check") {
    const row = firstRow(executionResult);
    const availableDays = numberValue(row, "available_days");
    const expectedDays = numberValue(row, "expected_days");

    return `The latest synthetic week has ${formatNumber(availableDays)} of ${formatNumber(
      expectedDays
    )} expected days available for ${stringValue(row, "range_start")} through ${stringValue(
      row,
      "range_end"
    )}. ${availableDays < expectedDays ? "Treat latest-week metrics as incomplete." : "The latest week is complete."}`;
  }

  return "The deterministic workflow completed and returned grounded synthetic-data results.";
}
