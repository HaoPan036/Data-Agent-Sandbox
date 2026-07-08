import { describe, expect, it } from "vitest";
import { executeAgentSql } from "./sqlExecutor";
import { generateAgentSql } from "./sqlGenerator";
import { validateAgentSql } from "./sqlValidator";

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
});
