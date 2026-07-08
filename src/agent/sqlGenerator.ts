import { getMetric } from "./metricCatalog";
import type { QuestionIntent, SqlPlan, SupportedIntentId } from "./types";

const revenue = getMetric("revenue");
const profit = getMetric("profit");

const planByIntent: Record<SupportedIntentId, SqlPlan> = {
  monthly_revenue_trend: {
    intentId: "monthly_revenue_trend",
    title: "Monthly revenue trend",
    sql: `SELECT orderMonth AS period, ${revenue.sqlExpression} AS revenue
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
    sql: `SELECT region, ${revenue.sqlExpression} AS revenue
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
    sql: `SELECT category, ${revenue.sqlExpression} AS revenue
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
    sql: `SELECT channel, ${profit.sqlExpression} AS profit
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

