import alasql from "alasql";
import { describe, expect, it, vi } from "vitest";
import { executeAgentSql } from "./sqlExecutor";
import { generateAgentSql } from "./sqlGenerator";
import { validateAgentSql } from "./sqlValidator";
import type { QueryRow } from "./types";

describe("executeAgentSql", () => {
  it("executes validated SQL against registered synthetic tables", () => {
    const plan = generateAgentSql(
      "What was total revenue last week?",
      "retail-growth-demo",
      "metric_lookup"
    );
    const validation = validateAgentSql(plan.statements, { requiresDateFilter: true });
    const results = executeAgentSql(plan.statements, validation);

    expect(results).toHaveLength(1);
    expect(results[0].rowCount).toBe(1);
    expect(results[0].columns).toContain("revenue");
    expect(results[0].rows[0].revenue).toBeGreaterThan(0);
  });

  it("executes join SQL for refund-rate comparison", () => {
    const plan = generateAgentSql(
      "Which product category had the highest refund rate last month?",
      "retail-growth-demo",
      "metric_comparison"
    );
    const validation = validateAgentSql(plan.statements, { requiresDateFilter: true });
    const results = executeAgentSql(plan.statements, validation);

    expect(results[0].rowCount).toBeGreaterThan(0);
    expect(results[0].columns).toContain("refund_rate");
  });

  it("skips execution when validation has errors", () => {
    const results = executeAgentSql(
      [
        {
          id: "bad_query",
          title: "Bad query",
          sql: "SELECT * FROM orders"
        }
      ],
      [
        {
          id: "bad_query:no_select_star",
          severity: "error",
          message: "SELECT * is not allowed.",
          passed: false
        }
      ]
    );

    expect(results).toEqual([]);
  });

  it("creates isolated database instances and mutable table data per execution", () => {
    const plan = generateAgentSql(
      "What was total revenue last week?",
      "retail-growth-demo",
      "metric_lookup"
    );
    const validation = validateAgentSql(plan.statements, { requiresDateFilter: true });
    const globalOrdersTable = alasql.tables.orders;
    type MutableDatabase = {
      databaseid: string;
      tables: Record<string, { data: QueryRow[] }>;
    };
    const databaseExec = vi.spyOn(alasql.Database.prototype, "exec");

    try {
      executeAgentSql(plan.statements, validation);
      const firstDatabase = databaseExec.mock.contexts[0] as unknown as MutableDatabase;

      expect(firstDatabase).toBeDefined();
      expect(alasql.databases[firstDatabase.databaseid]).toBeUndefined();

      executeAgentSql(plan.statements, validation);
      const secondDatabase = databaseExec.mock.contexts[1] as unknown as MutableDatabase;

      expect(secondDatabase).toBeDefined();
      expect(alasql.databases[secondDatabase.databaseid]).toBeUndefined();
      expect(alasql.tables.orders).toBe(globalOrdersTable);

      expect(firstDatabase).not.toBe(secondDatabase);
      expect(firstDatabase.tables).not.toBe(secondDatabase.tables);
      expect(firstDatabase.tables.orders.data).not.toBe(secondDatabase.tables.orders.data);
      expect(firstDatabase.tables.orders.data[0]).not.toBe(secondDatabase.tables.orders.data[0]);

      firstDatabase.tables.orders.data[0].region = "mutated-region";

      expect(secondDatabase.tables.orders.data[0].region).not.toBe("mutated-region");
    } finally {
      databaseExec.mockRestore();
    }
  });
});
