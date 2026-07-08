export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  relatedMetrics: string[];
  relatedTables: string[];
  tags: string[];
  lastUpdated: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: "revenue-definition",
    title: "Revenue definition",
    content:
      "Revenue is the sum of synthetic order revenue. It is calculated before refunds and should be paired with refund metrics when reviewing quality issues.",
    relatedMetrics: ["revenue"],
    relatedTables: ["orders"],
    tags: ["definition", "commerce"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "refund-rate-definition",
    title: "Refund rate definition",
    content:
      "Refund rate is refunded orders divided by total orders. Refund timing may differ from order timing, so the chosen date basis should be explicit.",
    relatedMetrics: ["refund_rate", "refund_amount"],
    relatedTables: ["orders", "refunds"],
    tags: ["definition", "quality"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "conversion-rate-definition",
    title: "Conversion rate definition",
    content:
      "Conversion rate is orders divided by sessions. Use the same region, channel, and date filters for numerator and denominator.",
    relatedMetrics: ["conversion_rate", "sessions", "orders"],
    relatedTables: ["traffic"],
    tags: ["definition", "funnel"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "ab-experiment-comparison",
    title: "A/B experiment comparison",
    content:
      "Experiment comparisons should compare variants over the same date range, region, channel, and experiment id. Report sample size before interpreting differences.",
    relatedMetrics: ["gmv", "active_users", "checkout_abandonment_rate", "payment_completion_rate"],
    relatedTables: ["experiment_events"],
    tags: ["experiment", "governance"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "campaign-review-baseline",
    title: "Campaign review baseline",
    content:
      "Campaign reviews should compare the campaign period with a previous baseline period of equal length and avoid treating correlation as proof of impact.",
    relatedMetrics: ["campaign_spend", "revenue", "revenue_per_session"],
    relatedTables: ["campaigns", "orders", "traffic"],
    tags: ["campaign", "baseline"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "latest-week-completeness",
    title: "Latest week completeness",
    content:
      "Latest week metrics may be incomplete when fewer than seven daily records are present. The sandbox intentionally includes an incomplete final week.",
    relatedMetrics: ["sessions", "revenue", "conversion_rate"],
    relatedTables: ["orders", "traffic", "experiment_events"],
    tags: ["freshness", "data-quality"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "causal-claim-caution",
    title: "Causal claim caution",
    content:
      "Do not make causal claims unless the analysis checks possible drivers, comparable periods, sample size, and known data quality caveats.",
    relatedMetrics: ["revenue", "conversion_rate", "gmv"],
    relatedTables: ["orders", "traffic", "experiment_events"],
    tags: ["governance", "causality"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "sensitive-data-policy",
    title: "Sensitive data policy",
    content:
      "User-level export is not allowed in this public sandbox. Sensitive identifiers are masked and should only support aggregated analysis.",
    relatedMetrics: [],
    relatedTables: ["customers_masked", "orders"],
    tags: ["sensitive-data", "policy", "governance"],
    lastUpdated: "2026-07-08"
  },
  {
    id: "metric-ambiguity-handling",
    title: "Metric ambiguity handling",
    content:
      "When a question contains ambiguous metric wording, the agent should ask for clarification or choose the documented metric with visible caveats.",
    relatedMetrics: ["revenue", "orders", "refund_rate", "conversion_rate"],
    relatedTables: ["orders", "traffic", "refunds"],
    tags: ["metric-catalog", "clarification"],
    lastUpdated: "2026-07-08"
  }
];

