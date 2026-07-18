import type { ColumnType, DatasetSchema, TableColumn } from "./types.js";

function columns(definitions: TableColumn[]) {
  return definitions;
}

function columnTypes(definitions: TableColumn[]) {
  return definitions.reduce<Record<string, ColumnType>>((types, column) => {
    types[column.name] = column.type;
    return types;
  }, {});
}

const ordersColumns = columns([
  { name: "order_id", type: "string", description: "Synthetic order identifier." },
  { name: "order_date", type: "string", description: "Date when the synthetic order was placed." },
  { name: "order_week", type: "string", description: "Derived week bucket for synthetic order date." },
  { name: "order_month", type: "string", description: "Derived month bucket for synthetic order date." },
  { name: "customer_id", type: "string", description: "Masked synthetic customer identifier." },
  { name: "product_id", type: "string", description: "Synthetic product identifier." },
  { name: "region", type: "string", description: "Generic market region." },
  { name: "channel", type: "string", description: "Generic acquisition channel." },
  { name: "category", type: "string", description: "Generic product category." },
  { name: "revenue", type: "number", description: "Synthetic order revenue." },
  { name: "discount_amount", type: "number", description: "Synthetic discount applied to the order." },
  { name: "quantity", type: "number", description: "Synthetic units in the order." },
  { name: "campaign_id", type: "string", description: "Synthetic campaign identifier when applicable." }
]);

const trafficColumns = columns([
  { name: "date", type: "string", description: "Synthetic traffic date." },
  { name: "date_week", type: "string", description: "Derived week bucket for synthetic traffic date." },
  { name: "date_month", type: "string", description: "Derived month bucket for synthetic traffic date." },
  { name: "region", type: "string", description: "Generic market region." },
  { name: "channel", type: "string", description: "Generic acquisition channel." },
  { name: "sessions", type: "number", description: "Synthetic sessions." },
  { name: "product_views", type: "number", description: "Synthetic product detail views." },
  { name: "add_to_cart", type: "number", description: "Synthetic add-to-cart events." },
  { name: "checkout_started", type: "number", description: "Synthetic checkout starts." },
  { name: "orders", type: "number", description: "Synthetic order count attributed to traffic." }
]);

const campaignsColumns = columns([
  { name: "campaign_id", type: "string", description: "Synthetic campaign identifier." },
  { name: "campaign_name", type: "string", description: "Generic campaign name." },
  { name: "start_date", type: "string", description: "Synthetic campaign start date." },
  { name: "end_date", type: "string", description: "Synthetic campaign end date." },
  { name: "region", type: "string", description: "Generic market region." },
  { name: "channel", type: "string", description: "Generic acquisition channel." },
  { name: "budget", type: "number", description: "Synthetic campaign budget." },
  { name: "campaign_type", type: "string", description: "Generic campaign type." }
]);

const productsColumns = columns([
  { name: "product_id", type: "string", description: "Synthetic product identifier." },
  { name: "category", type: "string", description: "Generic product category." },
  { name: "product_name", type: "string", description: "Generic product name." },
  { name: "unit_cost", type: "number", description: "Synthetic unit cost." },
  { name: "launch_date", type: "string", description: "Synthetic product launch date." }
]);

const customersColumns = columns([
  { name: "customer_id", type: "string", description: "Masked synthetic customer identifier." },
  { name: "customer_segment", type: "string", description: "Generic customer segment." },
  { name: "region", type: "string", description: "Generic market region." },
  { name: "signup_date", type: "string", description: "Synthetic signup date." },
  {
    name: "is_sensitive_masked",
    type: "boolean",
    description: "Flag showing that user-level sensitive data is masked."
  }
]);

const refundsColumns = columns([
  { name: "refund_id", type: "string", description: "Synthetic refund identifier." },
  { name: "order_id", type: "string", description: "Synthetic order identifier." },
  { name: "refund_date", type: "string", description: "Synthetic refund date." },
  { name: "refund_week", type: "string", description: "Derived week bucket for synthetic refund date." },
  { name: "refund_month", type: "string", description: "Derived month bucket for synthetic refund date." },
  { name: "refund_amount", type: "number", description: "Synthetic refunded amount." },
  { name: "refund_reason", type: "string", description: "Generic refund reason." }
]);

const experimentColumns = columns([
  { name: "event_date", type: "string", description: "Synthetic experiment event date." },
  { name: "event_week", type: "string", description: "Derived week bucket for synthetic experiment date." },
  { name: "event_month", type: "string", description: "Derived month bucket for synthetic experiment date." },
  { name: "experiment_id", type: "string", description: "Generic experiment identifier." },
  { name: "variant", type: "string", description: "Experiment variant." },
  { name: "region", type: "string", description: "Generic market region." },
  { name: "channel", type: "string", description: "Generic acquisition channel." },
  { name: "sessions", type: "number", description: "Synthetic experiment sessions." },
  { name: "pdp_views", type: "number", description: "Synthetic product detail page views." },
  { name: "add_to_cart", type: "number", description: "Synthetic add-to-cart events." },
  { name: "checkout_started", type: "number", description: "Synthetic checkout starts." },
  { name: "orders", type: "number", description: "Synthetic orders." },
  { name: "gmv", type: "number", description: "Synthetic gross merchandise value." },
  { name: "active_users", type: "number", description: "Synthetic active users." }
]);

export const schemaCatalog: DatasetSchema[] = [
  {
    tableName: "orders",
    displayName: "Orders",
    description: "Synthetic ecommerce order facts for public revenue and category analysis.",
    grain: "One row per synthetic order.",
    defaultDateColumn: "order_date",
    columns: ordersColumns,
    columnTypes: columnTypes(ordersColumns),
    allowedJoins: [
      { tableName: "products", on: "orders.product_id = products.product_id", relationship: "many-to-one" },
      {
        tableName: "customers_masked",
        on: "orders.customer_id = customers_masked.customer_id",
        relationship: "many-to-one"
      },
      { tableName: "campaigns", on: "orders.campaign_id = campaigns.campaign_id", relationship: "many-to-one" },
      { tableName: "refunds", on: "orders.order_id = refunds.order_id", relationship: "one-to-many" }
    ],
    sensitiveColumns: ["customer_id"],
    sampleQuestions: [
      "What was total revenue last week?",
      "Show weekly revenue by region for the last 8 weeks.",
      "Which product category had the highest refund rate last month?"
    ]
  },
  {
    tableName: "traffic",
    displayName: "Traffic",
    description: "Synthetic traffic funnel data by day, region, and channel.",
    grain: "One row per date, region, and channel.",
    defaultDateColumn: "date",
    columns: trafficColumns,
    columnTypes: columnTypes(trafficColumns),
    allowedJoins: [
      {
        tableName: "orders",
        on: "traffic.date = orders.order_date and traffic.region = orders.region and traffic.channel = orders.channel",
        relationship: "one-to-many"
      }
    ],
    sensitiveColumns: [],
    sampleQuestions: [
      "How did conversion rate change over the last 30 days?",
      "Which channel has the highest add-to-cart rate?",
      "Did the latest week have complete traffic data?"
    ]
  },
  {
    tableName: "campaigns",
    displayName: "Campaigns",
    description: "Synthetic campaign setup and budget metadata.",
    grain: "One row per campaign.",
    defaultDateColumn: "start_date",
    columns: campaignsColumns,
    columnTypes: columnTypes(campaignsColumns),
    allowedJoins: [
      { tableName: "orders", on: "campaigns.campaign_id = orders.campaign_id", relationship: "one-to-many" }
    ],
    sensitiveColumns: [],
    sampleQuestions: [
      "Run campaign performance review for campaign C001.",
      "Which campaign had the highest revenue per budget?",
      "Compare campaign period with the previous baseline period."
    ]
  },
  {
    tableName: "products",
    displayName: "Products",
    description: "Synthetic product catalog with generic names and categories.",
    grain: "One row per synthetic product.",
    defaultDateColumn: "launch_date",
    columns: productsColumns,
    columnTypes: columnTypes(productsColumns),
    allowedJoins: [
      { tableName: "orders", on: "products.product_id = orders.product_id", relationship: "one-to-many" }
    ],
    sensitiveColumns: [],
    sampleQuestions: [
      "Which category generated the most revenue?",
      "Which categories are affected during the refund spike?",
      "What categories are represented in this demo?"
    ]
  },
  {
    tableName: "customers_masked",
    displayName: "Masked Customers",
    description: "Masked synthetic customer attributes for aggregated analysis only.",
    grain: "One row per masked synthetic customer.",
    defaultDateColumn: "signup_date",
    columns: customersColumns,
    columnTypes: columnTypes(customersColumns),
    allowedJoins: [
      {
        tableName: "orders",
        on: "customers_masked.customer_id = orders.customer_id",
        relationship: "one-to-many"
      }
    ],
    sensitiveColumns: ["customer_id", "is_sensitive_masked"],
    sampleQuestions: [
      "How does revenue vary by masked customer segment?",
      "Which regions have the most masked customers?",
      "What sensitive columns are blocked from user-level export?"
    ]
  },
  {
    tableName: "refunds",
    displayName: "Refunds",
    description: "Synthetic refund facts with a known spike period for analysis.",
    grain: "One row per synthetic refund.",
    defaultDateColumn: "refund_date",
    columns: refundsColumns,
    columnTypes: columnTypes(refundsColumns),
    allowedJoins: [
      { tableName: "orders", on: "refunds.order_id = orders.order_id", relationship: "many-to-one" }
    ],
    sensitiveColumns: [],
    sampleQuestions: [
      "Which product category had the highest refund rate last month?",
      "When did refund amount spike?",
      "What refund reasons appear in the synthetic data?"
    ]
  },
  {
    tableName: "experiment_events",
    displayName: "Experiment Events",
    description: "Synthetic A/B experiment funnel events by variant, region, and channel.",
    grain: "One row per event date, experiment, variant, region, and channel.",
    defaultDateColumn: "event_date",
    columns: experimentColumns,
    columnTypes: columnTypes(experimentColumns),
    allowedJoins: [],
    sensitiveColumns: [],
    sampleQuestions: [
      "What are the daily trends for GMV and active users over the last 30 days?",
      "Which variant had higher revenue per session?",
      "Did the latest week have complete data?"
    ]
  }
];

export const ecommerceSchema = schemaCatalog[0];
export const schemaByTable = Object.fromEntries(
  schemaCatalog.map((schema) => [schema.tableName, schema])
) as Record<string, DatasetSchema>;

export const schemaColumnNames = Array.from(
  new Set([
    ...schemaCatalog.flatMap((schema) => schema.columns.map((column) => column.name)),
    "orderMonth",
    "order_week",
    "order_month",
    "date_week",
    "date_month",
    "refund_week",
    "refund_month",
    "event_week",
    "event_month",
    "cost",
    "units",
    "returned"
  ])
);

export const sensitiveColumnNames = Array.from(
  new Set(schemaCatalog.flatMap((schema) => schema.sensitiveColumns))
);
