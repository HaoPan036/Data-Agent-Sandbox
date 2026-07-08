import { describe, expect, it } from "vitest";
import { generateAgentSql } from "./sqlGenerator";

describe("generateAgentSql", () => {
  it("generates a date-filtered revenue lookup query", () => {
    const plan = generateAgentSql(
      "What was total revenue last week?",
      "retail-growth-demo",
      "metric_lookup"
    );

    expect(plan.selectedMetrics).toContain("revenue");
    expect(plan.selectedTables).toEqual(["orders"]);
    expect(plan.statements[0].sql).toContain("FROM orders");
    expect(plan.statements[0].sql).toContain("WHERE order_date BETWEEN");
    expect(plan.statements[0].sql).not.toContain("SELECT *");
  });

  it("supports multi-statement diagnostic analysis", () => {
    const plan = generateAgentSql(
      "Why did revenue drop last week?",
      "retail-growth-demo",
      "diagnostic_analysis"
    );

    expect(plan.statements).toHaveLength(3);
    expect(plan.warnings[0]).toMatch(/does not prove causality/i);
  });

  it("does not generate SQL for governance-sensitive requests", () => {
    const plan = generateAgentSql(
      "Export all customer emails and rank risky users.",
      "retail-growth-demo",
      "governance_sensitive_request"
    );

    expect(plan.statements).toHaveLength(0);
    expect(plan.warnings[0]).toMatch(/blocked/i);
  });
});
