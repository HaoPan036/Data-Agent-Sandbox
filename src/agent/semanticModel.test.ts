import { describe, expect, it } from "vitest";
import { knowledgeBase } from "./knowledgeBase";
import { metricCatalog } from "./metricCatalog";
import { schemaByTable, schemaCatalog, sensitiveColumnNames } from "./schema";

describe("semantic model", () => {
  it("marks sensitive columns", () => {
    expect(sensitiveColumnNames).toContain("customer_id");
    expect(sensitiveColumnNames).toContain("is_sensitive_masked");
  });

  it("defines metric source tables and required columns that exist in schema metadata", () => {
    for (const metric of metricCatalog) {
      for (const sourceTable of metric.sourceTables) {
        expect(schemaByTable[sourceTable]).toBeDefined();
      }

      for (const [tableName, columns] of Object.entries(metric.requiredColumns)) {
        const schema = schemaByTable[tableName];
        expect(schema).toBeDefined();

        const schemaColumns = new Set(schema.columns.map((column) => column.name));

        for (const column of columns) {
          expect(schemaColumns.has(column)).toBe(true);
        }
      }
    }
  });

  it("contains schema metadata for every synthetic table", () => {
    expect(schemaCatalog.map((schema) => schema.tableName).sort()).toEqual([
      "campaigns",
      "customers_masked",
      "experiment_events",
      "orders",
      "products",
      "refunds",
      "traffic"
    ]);
  });

  it("gives knowledge entries either related metrics or tags", () => {
    expect(knowledgeBase.length).toBeGreaterThanOrEqual(9);

    for (const entry of knowledgeBase) {
      expect(entry.relatedMetrics.length + entry.tags.length).toBeGreaterThan(0);
    }
  });
});

