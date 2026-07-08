import type { MetricDefinition } from "./types";

export const metricCatalog: MetricDefinition[] = [
  {
    id: "revenue",
    displayName: "Revenue",
    description: "Gross synthetic order revenue.",
    formula: "SUM(orders.revenue)",
    sourceTables: ["orders"],
    requiredColumns: { orders: ["revenue"] },
    allowedDimensions: ["order_date", "region", "channel", "category", "campaign_id"],
    defaultTimeGrain: "week",
    caveats: ["Revenue means sum of order revenue before refunds."],
    sensitivityLevel: "public"
  },
  {
    id: "orders",
    displayName: "Orders",
    description: "Count of synthetic orders.",
    formula: "COUNT(orders.order_id)",
    sourceTables: ["orders"],
    requiredColumns: { orders: ["order_id"] },
    allowedDimensions: ["order_date", "region", "channel", "category", "campaign_id"],
    defaultTimeGrain: "week",
    caveats: ["Order counts are generated from synthetic local data."],
    sensitivityLevel: "public"
  },
  {
    id: "average_order_value",
    displayName: "Average Order Value",
    description: "Revenue divided by orders.",
    formula: "SUM(orders.revenue) / COUNT(orders.order_id)",
    sourceTables: ["orders"],
    requiredColumns: { orders: ["revenue", "order_id"] },
    allowedDimensions: ["order_date", "region", "channel", "category"],
    defaultTimeGrain: "week",
    caveats: ["Average order value should be interpreted with order volume."],
    sensitivityLevel: "public"
  },
  {
    id: "refund_amount",
    displayName: "Refund Amount",
    description: "Total synthetic refunded amount.",
    formula: "SUM(refunds.refund_amount)",
    sourceTables: ["refunds"],
    requiredColumns: { refunds: ["refund_amount"] },
    allowedDimensions: ["refund_date", "refund_reason"],
    defaultTimeGrain: "week",
    caveats: ["Refund timing follows refund_date, not original order_date."],
    sensitivityLevel: "public"
  },
  {
    id: "refund_rate",
    displayName: "Refund Rate",
    description: "Refunded orders divided by total orders.",
    formula: "COUNT(refunds.refund_id) / COUNT(orders.order_id)",
    sourceTables: ["orders", "refunds"],
    requiredColumns: {
      orders: ["order_id"],
      refunds: ["refund_id", "order_id"]
    },
    allowedDimensions: ["order_date", "region", "channel", "category"],
    defaultTimeGrain: "week",
    caveats: ["Refund rate means refunded orders divided by total orders."],
    sensitivityLevel: "public"
  },
  {
    id: "sessions",
    displayName: "Sessions",
    description: "Synthetic web or app sessions.",
    formula: "SUM(traffic.sessions)",
    sourceTables: ["traffic"],
    requiredColumns: { traffic: ["sessions"] },
    allowedDimensions: ["date", "region", "channel"],
    defaultTimeGrain: "week",
    caveats: ["Latest week may be incomplete if fewer than 7 days are present."],
    sensitivityLevel: "public"
  },
  {
    id: "conversion_rate",
    displayName: "Conversion Rate",
    description: "Orders divided by sessions.",
    formula: "SUM(traffic.orders) / SUM(traffic.sessions)",
    sourceTables: ["traffic"],
    requiredColumns: { traffic: ["orders", "sessions"] },
    allowedDimensions: ["date", "region", "channel"],
    defaultTimeGrain: "week",
    caveats: ["Conversion rate means orders divided by sessions."],
    sensitivityLevel: "public"
  },
  {
    id: "add_to_cart_rate",
    displayName: "Add To Cart Rate",
    description: "Add-to-cart events divided by product views.",
    formula: "SUM(traffic.add_to_cart) / SUM(traffic.product_views)",
    sourceTables: ["traffic"],
    requiredColumns: { traffic: ["add_to_cart", "product_views"] },
    allowedDimensions: ["date", "region", "channel"],
    defaultTimeGrain: "week",
    caveats: ["Use product views as the denominator for this public demo."],
    sensitivityLevel: "public"
  },
  {
    id: "checkout_start_rate",
    displayName: "Checkout Start Rate",
    description: "Checkout starts divided by add-to-cart events.",
    formula: "SUM(traffic.checkout_started) / SUM(traffic.add_to_cart)",
    sourceTables: ["traffic"],
    requiredColumns: { traffic: ["checkout_started", "add_to_cart"] },
    allowedDimensions: ["date", "region", "channel"],
    defaultTimeGrain: "week",
    caveats: ["Compare this with downstream payment completion before making claims."],
    sensitivityLevel: "public"
  },
  {
    id: "campaign_spend",
    displayName: "Campaign Spend",
    description: "Synthetic campaign budget.",
    formula: "SUM(campaigns.budget)",
    sourceTables: ["campaigns"],
    requiredColumns: { campaigns: ["budget"] },
    allowedDimensions: ["start_date", "region", "channel", "campaign_type"],
    defaultTimeGrain: "month",
    caveats: ["Campaign analysis should compare campaign period with a previous baseline period of equal length."],
    sensitivityLevel: "public"
  },
  {
    id: "revenue_per_session",
    displayName: "Revenue Per Session",
    description: "Revenue divided by sessions.",
    formula: "SUM(orders.revenue) / SUM(traffic.sessions)",
    sourceTables: ["orders", "traffic"],
    requiredColumns: {
      orders: ["revenue", "order_date", "region", "channel"],
      traffic: ["sessions", "date", "region", "channel"]
    },
    allowedDimensions: ["date", "region", "channel", "category"],
    defaultTimeGrain: "week",
    caveats: ["Join date, region, and channel consistently before comparing."],
    sensitivityLevel: "public"
  },
  {
    id: "gmv",
    displayName: "GMV",
    description: "Synthetic gross merchandise value in experiment events.",
    formula: "SUM(experiment_events.gmv)",
    sourceTables: ["experiment_events"],
    requiredColumns: { experiment_events: ["gmv"] },
    allowedDimensions: ["event_date", "experiment_id", "variant", "region", "channel"],
    defaultTimeGrain: "day",
    caveats: ["A/B experiment analysis should compare variants over the same date range."],
    sensitivityLevel: "public"
  },
  {
    id: "active_users",
    displayName: "Active Users",
    description: "Synthetic active users in experiment events.",
    formula: "SUM(experiment_events.active_users)",
    sourceTables: ["experiment_events"],
    requiredColumns: { experiment_events: ["active_users"] },
    allowedDimensions: ["event_date", "experiment_id", "variant", "region", "channel"],
    defaultTimeGrain: "day",
    caveats: ["Compare active users with sessions to understand sample size."],
    sensitivityLevel: "public"
  },
  {
    id: "checkout_abandonment_rate",
    displayName: "Checkout Abandonment Rate",
    description: "Checkout starts minus orders divided by checkout starts.",
    formula: "(SUM(experiment_events.checkout_started) - SUM(experiment_events.orders)) / SUM(experiment_events.checkout_started)",
    sourceTables: ["experiment_events"],
    requiredColumns: { experiment_events: ["checkout_started", "orders"] },
    allowedDimensions: ["event_date", "experiment_id", "variant", "region", "channel"],
    defaultTimeGrain: "day",
    caveats: ["Do not make causal claims unless the analysis checks possible drivers."],
    sensitivityLevel: "public"
  },
  {
    id: "payment_completion_rate",
    displayName: "Payment Completion Rate",
    description: "Orders divided by checkout starts.",
    formula: "SUM(experiment_events.orders) / SUM(experiment_events.checkout_started)",
    sourceTables: ["experiment_events"],
    requiredColumns: { experiment_events: ["orders", "checkout_started"] },
    allowedDimensions: ["event_date", "experiment_id", "variant", "region", "channel"],
    defaultTimeGrain: "day",
    caveats: ["A/B experiment analysis should compare variants over the same date range."],
    sensitivityLevel: "public"
  }
];

export function getMetric(metricId: string) {
  const metric = metricCatalog.find((candidate) => candidate.id === metricId);

  if (!metric) {
    throw new Error(`Unknown metric: ${metricId}`);
  }

  return metric;
}

