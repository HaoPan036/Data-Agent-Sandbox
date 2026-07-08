import { campaigns } from "../data/syntheticEcommerce";
import {
  getLastCompleteWeekRange,
  getLastMonthRange,
  getLastNDaysRange,
  getLastNWeeksRange,
  getLatestWeekRange,
  getPreviousPeriodRange,
  isLatestWeekIncomplete
} from "./dateUtils";
import { normalizeQuestion } from "./intentRouter";
import type { AgentIntent, AgentSqlPlan, QuestionIntent, SqlPlan, SupportedIntentId } from "./types";

const revenueExpression = "SUM(revenue)";
const profitExpression = "SUM(revenue) - SUM(cost)";

const planByIntent: Record<SupportedIntentId, SqlPlan> = {
  monthly_revenue_trend: {
    intentId: "monthly_revenue_trend",
    title: "Monthly revenue trend",
    sql: `SELECT orderMonth AS period, ${revenueExpression} AS revenue
FROM ?
GROUP BY orderMonth
ORDER BY orderMonth`,
    chart: {
      type: "line",
      xKey: "period",
      yKey: "revenue",
      yLabel: "Revenue"
    },
    rationale:
      "Group synthetic orders by month and aggregate gross revenue to show whether revenue is moving up or down."
  },
  regional_revenue: {
    intentId: "regional_revenue",
    title: "Revenue by region",
    sql: `SELECT region, ${revenueExpression} AS revenue
FROM ?
GROUP BY region
ORDER BY revenue DESC`,
    chart: {
      type: "bar",
      xKey: "region",
      yKey: "revenue",
      yLabel: "Revenue"
    },
    rationale:
      "Group synthetic orders by region and rank regions by gross revenue."
  },
  top_categories: {
    intentId: "top_categories",
    title: "Top categories by revenue",
    sql: `SELECT category, ${revenueExpression} AS revenue
FROM ?
GROUP BY category
ORDER BY revenue DESC`,
    chart: {
      type: "bar",
      xKey: "category",
      yKey: "revenue",
      yLabel: "Revenue"
    },
    rationale:
      "Group synthetic orders by product category and rank categories by gross revenue."
  },
  profit_by_channel: {
    intentId: "profit_by_channel",
    title: "Profit by channel",
    sql: `SELECT channel, ${profitExpression} AS profit
FROM ?
GROUP BY channel
ORDER BY profit DESC`,
    chart: {
      type: "bar",
      xKey: "channel",
      yKey: "profit",
      yLabel: "Profit"
    },
    rationale:
      "Group synthetic orders by channel and compare revenue minus cost."
  }
};

export function generateSql(intent: QuestionIntent): SqlPlan {
  return planByIntent[intent.id];
}

function sqlPlan(
  statements: AgentSqlPlan["statements"],
  selectedMetrics: string[],
  selectedTables: string[],
  warnings: string[] = [],
  suggestedFollowUps: string[] = []
): AgentSqlPlan {
  return {
    statements,
    selectedMetrics,
    selectedTables,
    warnings,
    suggestedFollowUps
  };
}

export function generateAgentSql(question: string, topicId: string, intent: AgentIntent): AgentSqlPlan {
  const normalizedQuestion = normalizeQuestion(question);
  const lastCompleteWeek = getLastCompleteWeekRange();
  const lastMonth = getLastMonthRange();
  const lastEightWeeks = getLastNWeeksRange(8);
  const latestWeek = getLatestWeekRange();
  const lastThirtyDays = getLastNDaysRange(30);
  const lastFourteenDays = getLastNDaysRange(14);

  if (intent === "governance_sensitive_request") {
    return sqlPlan(
      [],
      [],
      [],
      ["Blocked before SQL generation because the request asks for user-level or sensitive data."],
      [
        "Ask for aggregated revenue by region.",
        "Ask for masked customer counts by segment.",
        "Ask for sensitive-column policy details."
      ]
    );
  }

  if (intent === "unknown" || topicId === "knowledge-base-demo") {
    return sqlPlan(
      [],
      [],
      [],
      topicId === "knowledge-base-demo"
        ? ["Knowledge base retrieval execution is planned for a later stage."]
        : ["No deterministic SQL template matched this question."],
      [
        "What was total revenue last week?",
        "Show weekly revenue by region for the last 8 weeks.",
        "Did the latest week have complete data?"
      ]
    );
  }

  if (intent === "metric_lookup") {
    return sqlPlan(
      [
        {
          id: "total_revenue_last_week",
          title: "Total revenue last complete week",
          sql: `SELECT SUM(revenue) AS revenue,
  COUNT(order_id) AS orders,
  SUM(revenue) / COUNT(order_id) AS average_order_value
FROM orders
WHERE order_date BETWEEN '${lastCompleteWeek.start}' AND '${lastCompleteWeek.end}'`
        }
      ],
      ["revenue", "orders", "average_order_value"],
      ["orders"],
      [],
      ["Show weekly revenue by region for the last 8 weeks.", "Why did revenue drop last week?"]
    );
  }

  if (intent === "metric_comparison") {
    return sqlPlan(
      [
        {
          id: "refund_rate_by_category",
          title: "Refund rate by product category last month",
          sql: `SELECT o.category AS category,
  COUNT(DISTINCT o.order_id) AS orders,
  COUNT(DISTINCT r.refund_id) AS refunded_orders,
  ROUND(COUNT(DISTINCT r.refund_id) * 1.0 / COUNT(DISTINCT o.order_id), 4) AS refund_rate,
  SUM(CASE WHEN r.refund_amount IS NULL THEN 0 ELSE r.refund_amount END) AS refund_amount
FROM orders AS o
LEFT JOIN refunds AS r ON o.order_id = r.order_id
WHERE o.order_date BETWEEN '${lastMonth.start}' AND '${lastMonth.end}'
GROUP BY o.category
ORDER BY refund_rate DESC
LIMIT 5`
        }
      ],
      ["refund_rate", "orders", "refund_amount"],
      ["orders", "refunds"],
      [],
      ["Why did revenue drop last week?", "Show weekly revenue by region for the last 8 weeks."]
    );
  }

  if (intent === "trend_analysis" && (topicId === "experiment-metrics-demo" || hasExperimentTrend(normalizedQuestion))) {
    return sqlPlan(
      [
        {
          id: "daily_gmv_active_users",
          title: "Daily GMV and active users last 30 days",
          sql: `SELECT event_date,
  SUM(gmv) AS gmv,
  SUM(active_users) AS active_users
FROM experiment_events
WHERE event_date BETWEEN '${lastThirtyDays.start}' AND '${lastThirtyDays.end}'
GROUP BY event_date
ORDER BY event_date`
        }
      ],
      ["gmv", "active_users"],
      ["experiment_events"],
      [],
      ["Which variant had higher revenue per session?", "Did the latest week have complete data?"]
    );
  }

  if (intent === "trend_analysis") {
    return sqlPlan(
      [
        {
          id: "weekly_revenue_by_region",
          title: "Weekly revenue by region for the last 8 weeks",
          sql: `SELECT order_week,
  region,
  SUM(revenue) AS revenue
FROM orders
WHERE order_date BETWEEN '${lastEightWeeks.start}' AND '${lastEightWeeks.end}'
GROUP BY order_week, region
ORDER BY order_week, region`
        }
      ],
      ["revenue"],
      ["orders"],
      [],
      ["What was total revenue last week?", "Why did revenue drop last week?"]
    );
  }

  if (intent === "diagnostic_analysis") {
    const previousWeek = getPreviousPeriodRange(lastCompleteWeek);

    return sqlPlan(
      [
        {
          id: "revenue_current_vs_previous_week",
          title: "Revenue current vs previous week",
          sql: `SELECT SUM(CASE WHEN order_date BETWEEN '${lastCompleteWeek.start}' AND '${lastCompleteWeek.end}' THEN revenue ELSE 0 END) AS current_revenue,
  SUM(CASE WHEN order_date BETWEEN '${previousWeek.start}' AND '${previousWeek.end}' THEN revenue ELSE 0 END) AS previous_revenue,
  SUM(CASE WHEN order_date BETWEEN '${lastCompleteWeek.start}' AND '${lastCompleteWeek.end}' THEN revenue ELSE 0 END) -
    SUM(CASE WHEN order_date BETWEEN '${previousWeek.start}' AND '${previousWeek.end}' THEN revenue ELSE 0 END) AS revenue_change
FROM orders
WHERE order_date BETWEEN '${previousWeek.start}' AND '${lastCompleteWeek.end}'`
        },
        {
          id: "revenue_change_by_region",
          title: "Revenue change by region",
          sql: `SELECT region,
  SUM(CASE WHEN order_date BETWEEN '${lastCompleteWeek.start}' AND '${lastCompleteWeek.end}' THEN revenue ELSE 0 END) AS current_revenue,
  SUM(CASE WHEN order_date BETWEEN '${previousWeek.start}' AND '${previousWeek.end}' THEN revenue ELSE 0 END) AS previous_revenue,
  SUM(CASE WHEN order_date BETWEEN '${lastCompleteWeek.start}' AND '${lastCompleteWeek.end}' THEN revenue ELSE 0 END) -
    SUM(CASE WHEN order_date BETWEEN '${previousWeek.start}' AND '${previousWeek.end}' THEN revenue ELSE 0 END) AS revenue_change
FROM orders
WHERE order_date BETWEEN '${previousWeek.start}' AND '${lastCompleteWeek.end}'
GROUP BY region
ORDER BY revenue_change ASC
LIMIT 8`
        },
        {
          id: "revenue_change_by_category",
          title: "Revenue change by category",
          sql: `SELECT category,
  SUM(CASE WHEN order_date BETWEEN '${lastCompleteWeek.start}' AND '${lastCompleteWeek.end}' THEN revenue ELSE 0 END) AS current_revenue,
  SUM(CASE WHEN order_date BETWEEN '${previousWeek.start}' AND '${previousWeek.end}' THEN revenue ELSE 0 END) AS previous_revenue,
  SUM(CASE WHEN order_date BETWEEN '${lastCompleteWeek.start}' AND '${lastCompleteWeek.end}' THEN revenue ELSE 0 END) -
    SUM(CASE WHEN order_date BETWEEN '${previousWeek.start}' AND '${previousWeek.end}' THEN revenue ELSE 0 END) AS revenue_change
FROM orders
WHERE order_date BETWEEN '${previousWeek.start}' AND '${lastCompleteWeek.end}'
GROUP BY category
ORDER BY revenue_change ASC
LIMIT 8`
        }
      ],
      ["revenue"],
      ["orders"],
      ["Diagnostic output is directional only and does not prove causality."],
      ["Show weekly revenue by region for the last 8 weeks.", "Which product category had the highest refund rate last month?"]
    );
  }

  if (intent === "campaign_review") {
    const campaignId = normalizedQuestion.match(/\bc\d{3}\b/i)?.[0]?.toUpperCase() ?? "C001";
    const campaign = campaigns.find((candidate) => candidate.campaign_id === campaignId) ?? campaigns[0];
    const campaignRange = { start: campaign.start_date, end: campaign.end_date };
    const baselineRange = getPreviousPeriodRange(campaignRange);

    return sqlPlan(
      [
        {
          id: "campaign_period_summary",
          title: `${campaign.campaign_id} campaign period summary`,
          sql: `SELECT '${campaign.campaign_id}' AS campaign_id,
  'campaign_period' AS period_label,
  SUM(revenue) AS revenue,
  COUNT(order_id) AS orders,
  SUM(revenue) / COUNT(order_id) AS average_order_value
FROM orders
WHERE campaign_id = '${campaign.campaign_id}'
  AND order_date BETWEEN '${campaignRange.start}' AND '${campaignRange.end}'`
        },
        {
          id: "campaign_baseline_summary",
          title: `${campaign.campaign_id} previous baseline summary`,
          sql: `SELECT '${campaign.campaign_id}' AS campaign_id,
  'previous_baseline' AS period_label,
  SUM(revenue) AS revenue,
  COUNT(order_id) AS orders,
  SUM(revenue) / COUNT(order_id) AS average_order_value
FROM orders
WHERE region = '${campaign.region}'
  AND channel = '${campaign.channel}'
  AND order_date BETWEEN '${baselineRange.start}' AND '${baselineRange.end}'`
        }
      ],
      ["revenue", "orders", "average_order_value", "campaign_spend"],
      ["orders", "campaigns"],
      ["Campaign review compares the campaign to a previous equal-length baseline, not a causal holdout."],
      ["Compare campaign period by category.", "Check refund rate during the campaign window."]
    );
  }

  if (intent === "experiment_analysis") {
    if (normalizedQuestion.includes("funnel conversion") || normalizedQuestion.includes("across regions")) {
      return sqlPlan(
        [
          {
            id: "funnel_conversion_by_region",
            title: "Funnel conversion rates by region for the past week",
            sql: `SELECT region,
  SUM(sessions) AS sessions,
  SUM(pdp_views) AS pdp_views,
  SUM(add_to_cart) AS add_to_cart,
  SUM(checkout_started) AS checkout_started,
  SUM(orders) AS orders,
  ROUND(SUM(add_to_cart) * 1.0 / SUM(pdp_views), 4) AS add_to_cart_rate,
  ROUND(SUM(orders) * 1.0 / SUM(sessions), 4) AS conversion_rate
FROM experiment_events
WHERE event_date BETWEEN '${latestWeek.start}' AND '${latestWeek.end}'
GROUP BY region
ORDER BY conversion_rate DESC
LIMIT 8`
          }
        ],
        ["sessions", "add_to_cart_rate", "conversion_rate"],
        ["experiment_events"],
        isLatestWeekIncomplete() ? ["Latest synthetic week has fewer than 7 available days."] : [],
        ["Did the latest week have complete data?", "Which variant had higher revenue per session?"]
      );
    }

    if (normalizedQuestion.includes("abandonment")) {
      return sqlPlan(
        [
          {
            id: "checkout_abandonment_by_variant",
            title: "Checkout abandonment rate by variant last 14 days",
            sql: `SELECT variant,
  SUM(checkout_started) AS checkout_started,
  SUM(orders) AS orders,
  ROUND((SUM(checkout_started) - SUM(orders)) * 1.0 / SUM(checkout_started), 4) AS checkout_abandonment_rate
FROM experiment_events
WHERE event_date BETWEEN '${lastFourteenDays.start}' AND '${lastFourteenDays.end}'
GROUP BY variant
ORDER BY checkout_abandonment_rate ASC
LIMIT 8`
          }
        ],
        ["checkout_abandonment_rate", "payment_completion_rate"],
        ["experiment_events"],
        [],
        ["Which variant had higher revenue per session?", "How do funnel conversion rates compare across regions for the past week?"]
      );
    }

    return sqlPlan(
      [
        {
          id: "revenue_per_session_by_variant",
          title: "Revenue per session by variant",
          sql: `SELECT variant,
  SUM(gmv) AS gmv,
  SUM(sessions) AS sessions,
  ROUND(SUM(gmv) * 1.0 / SUM(sessions), 4) AS revenue_per_session
FROM experiment_events
WHERE event_date BETWEEN '${lastThirtyDays.start}' AND '${lastThirtyDays.end}'
GROUP BY variant
ORDER BY revenue_per_session DESC
LIMIT 8`
        }
      ],
      ["gmv", "sessions", "revenue_per_session"],
      ["experiment_events"],
      [],
      ["What is the comparison of checkout abandonment rate between experiment variants for the last 14 days?", "Did the latest week have complete data?"]
    );
  }

  if (intent === "data_completeness_check") {
    return sqlPlan(
      [
        {
          id: "latest_week_completeness",
          title: "Latest week completeness",
          sql: `SELECT COUNT(DISTINCT event_date) AS available_days,
  7 AS expected_days,
  '${latestWeek.start}' AS range_start,
  '${latestWeek.end}' AS range_end
FROM experiment_events
WHERE event_date BETWEEN '${latestWeek.start}' AND '${latestWeek.end}'`
        }
      ],
      ["active_users", "gmv"],
      ["experiment_events"],
      isLatestWeekIncomplete() ? ["Latest synthetic week has fewer than 7 available days."] : [],
      ["Show daily trends for GMV and active users over the last 30 days."]
    );
  }

  return sqlPlan([], [], [], ["No deterministic SQL template matched this question."]);
}

function hasExperimentTrend(normalizedQuestion: string) {
  return normalizedQuestion.includes("gmv") || normalizedQuestion.includes("active users");
}
