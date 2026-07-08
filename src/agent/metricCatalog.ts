import type { MetricDefinition } from "./types";

export const metricCatalog: MetricDefinition[] = [
  {
    id: "revenue",
    label: "Revenue",
    description: "Gross order revenue in the synthetic ecommerce dataset.",
    sqlExpression: "SUM(revenue)",
    valueType: "currency"
  },
  {
    id: "profit",
    label: "Profit",
    description: "Revenue minus cost in the synthetic ecommerce dataset.",
    sqlExpression: "SUM(revenue) - SUM(cost)",
    valueType: "currency"
  },
  {
    id: "orders",
    label: "Orders",
    description: "Count of synthetic ecommerce orders.",
    sqlExpression: "COUNT(*)",
    valueType: "number"
  },
  {
    id: "units",
    label: "Units",
    description: "Total synthetic units sold.",
    sqlExpression: "SUM(units)",
    valueType: "number"
  }
];

export function getMetric(metricId: string) {
  const metric = metricCatalog.find((candidate) => candidate.id === metricId);

  if (!metric) {
    throw new Error(`Unknown metric: ${metricId}`);
  }

  return metric;
}

