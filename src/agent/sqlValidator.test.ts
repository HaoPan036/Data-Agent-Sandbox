import { describe, expect, it } from "vitest";
import { generateAgentSql } from "./sqlGenerator";
import { hasValidationErrors, validateAgentSql } from "./sqlValidator";

describe("validateAgentSql", () => {
  it("passes generated deterministic SQL", () => {
    const plan = generateAgentSql(
      "Show weekly revenue by region for the last 8 weeks.",
      "retail-growth-demo",
      "trend_analysis"
    );
    const results = validateAgentSql(plan.statements, {
      requiresDateFilter: true,
      userQuestion: "Show weekly revenue by region for the last 8 weeks."
    });

    expect(hasValidationErrors(results)).toBe(false);
    expect(results.some((result) => result.id.endsWith("date_filter") && result.passed)).toBe(true);
  });

  it("blocks select star and unknown columns", () => {
    const results = validateAgentSql(
      [
        {
          id: "bad_query",
          title: "Bad query",
          sql: "SELECT *, secret_margin FROM orders WHERE order_date BETWEEN '2026-01-01' AND '2026-01-07'"
        }
      ],
      { requiresDateFilter: true }
    );

    expect(hasValidationErrors(results)).toBe(true);
    expect(results.map((result) => result.id)).toContain("bad_query:no_select_star");
    expect(results.map((result) => result.id)).toContain("bad_query:known_columns");
  });

  it("blocks sensitive export prompts before execution", () => {
    const results = validateAgentSql([], {
      userQuestion: "Export all customer emails and rank risky users."
    });

    expect(hasValidationErrors(results)).toBe(true);
    expect(results[0].message).toMatch(/blocked/i);
  });
});
