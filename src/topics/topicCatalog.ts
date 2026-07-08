import type { Topic, TopicSourceType } from "./topicTypes";

const retailGlossary = [
  ["Revenue", "Sum of synthetic order revenue before refunds.", "revenue", "orders"],
  ["Orders", "Count of synthetic ecommerce orders.", "orders", "orders"],
  ["Average Order Value", "Revenue divided by orders.", "average_order_value", "orders"],
  ["Refund Rate", "Refunded orders divided by total orders.", "refund_rate", "refunds"],
  ["Sessions", "Synthetic visits grouped by day, region, and channel.", "sessions", "traffic"],
  ["Conversion Rate", "Orders divided by sessions.", "conversion_rate", "traffic"],
  ["Revenue Per Session", "Revenue divided by sessions after aligned filters.", "revenue_per_session", "traffic"],
  ["Campaign Spend", "Synthetic budget associated with public demo campaigns.", "campaign_spend", "campaigns"]
] as const;

const experimentGlossary = [
  ["GMV", "Synthetic gross merchandise value in experiment events.", "gmv", "experiment_events"],
  ["Active Users", "Synthetic active users in experiment events.", "active_users", "experiment_events"],
  ["Variant", "Control or treatment assignment in the public experiment demo.", undefined, "experiment_events"],
  ["Checkout Abandonment Rate", "Checkout starts minus orders divided by checkout starts.", "checkout_abandonment_rate", "experiment_events"],
  ["Payment Completion Rate", "Orders divided by checkout starts.", "payment_completion_rate", "experiment_events"],
  ["PDP Views", "Synthetic product detail page views.", undefined, "experiment_events"],
  ["Add To Cart", "Synthetic add-to-cart events.", "add_to_cart_rate", "experiment_events"],
  ["Experiment Window", "The date range used to compare variants consistently.", undefined, "experiment_events"]
] as const;

const knowledgeGlossary = [
  ["Knowledge Entry", "A public markdown-style business rule or metric note.", undefined, undefined],
  ["Metric Caveat", "A visible limitation attached to a metric definition.", undefined, undefined],
  ["Sensitive Data Policy", "Rule that blocks user-level export and marks masked identifiers.", undefined, "customers_masked"],
  ["Metric Ambiguity", "A question that may map to more than one documented metric.", undefined, undefined],
  ["Latest Week Completeness", "Freshness check for whether seven daily records exist.", undefined, "traffic"],
  ["Causal Claim", "A statement that requires driver checks before being made.", undefined, undefined],
  ["Baseline Period", "Previous equal-length comparison period for campaign review.", undefined, "campaigns"],
  ["Governance Status", "Readiness state for validation, policy, evaluation, and reports.", undefined, undefined]
] as const;

function glossaryFrom(items: readonly (readonly [string, string, string | undefined, string | undefined])[]) {
  return items.map(([term, definition, metricId, tableName]) => ({
    term,
    definition,
    metricId,
    tableName
  }));
}

export const validTopicSourceTypes: TopicSourceType[] = [
  "Synthetic Tables",
  "Markdown Knowledge",
  "CSV Demo"
];

export const topicCatalog: Topic[] = [
  {
    id: "retail-growth-demo",
    name: "Retail Growth Demo",
    description:
      "Synthetic ecommerce topic for revenue, orders, traffic, campaigns, refunds, and product category analysis.",
    owner: {
      ownerName: "Demo Owner",
      ownerEmail: "demo.owner@example.com"
    },
    accessLevel: "Public Demo",
    sourceType: "Synthetic Tables",
    createdAt: "2026-07-01",
    updatedAt: "2026-07-08",
    status: "Active",
    tags: ["Demo", "Public", "Mine"],
    dataSources: [
      {
        id: "orders-source",
        name: "Synthetic Orders",
        sourceType: "Synthetic Tables",
        tableName: "orders",
        description: "Order facts with revenue, categories, channels, and campaigns.",
        freshness: "Daily through incomplete latest week",
        rowCountLabel: "Generated locally"
      },
      {
        id: "traffic-source",
        name: "Synthetic Traffic",
        sourceType: "Synthetic Tables",
        tableName: "traffic",
        description: "Daily funnel metrics by region and channel.",
        freshness: "Daily through incomplete latest week",
        rowCountLabel: "Generated locally"
      },
      {
        id: "refunds-source",
        name: "Synthetic Refunds",
        sourceType: "Synthetic Tables",
        tableName: "refunds",
        description: "Refund facts with an intentional spike period.",
        freshness: "Daily synthetic events",
        rowCountLabel: "Generated locally"
      }
    ],
    glossary: glossaryFrom(retailGlossary),
    sampleQuestions: [
      "What was total revenue last week?",
      "Which product category had the highest refund rate last month?",
      "Show weekly revenue by region for the last 8 weeks.",
      "Why did revenue drop last week?",
      "Run campaign performance review for campaign C001."
    ],
    sessions: [
      { id: "retail-session-1", title: "Weekly revenue review", createdAt: "2026-07-08", status: "Draft" },
      { id: "retail-session-2", title: "Refund spike triage", createdAt: "2026-07-07", status: "Reviewed" },
      { id: "retail-session-3", title: "Campaign C001 baseline", createdAt: "2026-07-06", status: "Evaluated" }
    ],
    governanceStatus: {
      sqlValidation: "Ready",
      sensitiveDataPolicy: "Ready",
      evaluation: "Planned",
      reportReview: "Planned"
    }
  },
  {
    id: "experiment-metrics-demo",
    name: "Experiment Metrics Demo",
    description:
      "Synthetic A/B experiment topic for funnel metrics, variant comparison, GMV, active users, checkout abandonment, and payment completion.",
    owner: {
      ownerName: "Analytics Owner",
      ownerEmail: "analytics.owner@example.com"
    },
    accessLevel: "Public Demo",
    sourceType: "Synthetic Tables",
    createdAt: "2026-07-02",
    updatedAt: "2026-07-08",
    status: "Active",
    tags: ["Demo", "Public", "Mine"],
    dataSources: [
      {
        id: "experiment-events-source",
        name: "Synthetic Experiment Events",
        sourceType: "Synthetic Tables",
        tableName: "experiment_events",
        description: "Experiment events by date, variant, region, and channel.",
        freshness: "Daily through incomplete latest week",
        rowCountLabel: "Generated locally"
      }
    ],
    glossary: glossaryFrom(experimentGlossary),
    sampleQuestions: [
      "What are the daily trends for GMV and active users over the last 30 days?",
      "How do funnel conversion rates compare across regions for the past week?",
      "What is the comparison of checkout abandonment rate between experiment variants for the last 14 days?",
      "Which variant had higher revenue per session?",
      "Did the latest week have complete data?"
    ],
    sessions: [
      { id: "experiment-session-1", title: "Variant funnel comparison", createdAt: "2026-07-08", status: "Draft" },
      { id: "experiment-session-2", title: "Latest week completeness", createdAt: "2026-07-07", status: "Reviewed" },
      { id: "experiment-session-3", title: "GMV and active users trend", createdAt: "2026-07-05", status: "Evaluated" }
    ],
    governanceStatus: {
      sqlValidation: "Ready",
      sensitiveDataPolicy: "Ready",
      evaluation: "Planned",
      reportReview: "Planned"
    }
  },
  {
    id: "knowledge-base-demo",
    name: "Knowledge Base Demo",
    description:
      "A documentation oriented topic showing how markdown style business knowledge can ground answers.",
    owner: {
      ownerName: "Demo Owner",
      ownerEmail: "demo.owner@example.com"
    },
    accessLevel: "Portfolio Demo",
    sourceType: "Markdown Knowledge",
    createdAt: "2026-07-03",
    updatedAt: "2026-07-08",
    status: "Active",
    tags: ["Demo", "Public", "Mine"],
    dataSources: [
      {
        id: "knowledge-source",
        name: "Public Knowledge Entries",
        sourceType: "Markdown Knowledge",
        description: "Generic metric definitions, caveats, and governance guidance.",
        freshness: "Versioned with repository",
        rowCountLabel: "9 entries"
      },
      {
        id: "csv-demo-source",
        name: "CSV Demo Placeholder",
        sourceType: "CSV Demo",
        description: "Placeholder source type for future public CSV uploads.",
        freshness: "Coming soon",
        rowCountLabel: "No runtime upload yet"
      }
    ],
    glossary: glossaryFrom(knowledgeGlossary),
    sampleQuestions: [
      "What does revenue mean in this sandbox?",
      "When should the agent avoid causal claims?",
      "How should ambiguous metric wording be handled?",
      "What is the sensitive data policy?",
      "Why might latest week metrics be incomplete?"
    ],
    sessions: [
      { id: "knowledge-session-1", title: "Metric caveat review", createdAt: "2026-07-08", status: "Reviewed" },
      { id: "knowledge-session-2", title: "Sensitive data policy check", createdAt: "2026-07-06", status: "Evaluated" },
      { id: "knowledge-session-3", title: "Latest week guidance", createdAt: "2026-07-04", status: "Draft" }
    ],
    governanceStatus: {
      sqlValidation: "Planned",
      sensitiveDataPolicy: "Ready",
      evaluation: "Planned",
      reportReview: "Planned"
    }
  }
];

export function getTopicById(topicId: string) {
  return topicCatalog.find((topic) => topic.id === topicId);
}
