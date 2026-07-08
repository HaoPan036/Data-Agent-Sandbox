import type { DatasetSchema } from "./types";

export const ecommerceSchema: DatasetSchema = {
  tableName: "orders",
  description:
    "Synthetic ecommerce order facts. All values are generated for a public sandbox.",
  columns: [
    {
      name: "orderId",
      type: "string",
      description: "Synthetic order identifier."
    },
    {
      name: "orderDate",
      type: "string",
      description: "Synthetic order date in ISO format."
    },
    {
      name: "orderMonth",
      type: "string",
      description: "Synthetic order month in YYYY-MM format."
    },
    {
      name: "region",
      type: "string",
      description: "Synthetic sales region."
    },
    {
      name: "category",
      type: "string",
      description: "Synthetic product category."
    },
    {
      name: "channel",
      type: "string",
      description: "Synthetic acquisition or sales channel."
    },
    {
      name: "customerSegment",
      type: "string",
      description: "Synthetic customer segment."
    },
    {
      name: "revenue",
      type: "number",
      description: "Synthetic order revenue."
    },
    {
      name: "cost",
      type: "number",
      description: "Synthetic order cost."
    },
    {
      name: "units",
      type: "number",
      description: "Synthetic units sold."
    },
    {
      name: "returned",
      type: "boolean",
      description: "Synthetic return flag."
    }
  ]
};

export const schemaColumnNames = ecommerceSchema.columns.map(
  (column) => column.name
);

