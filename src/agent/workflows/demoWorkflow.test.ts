import { describe, expect, it } from "vitest";
import { runDemoWorkflow } from "./demoWorkflow";

describe("runDemoWorkflow", () => {
  it("returns validated SQL, rows, trace events, and a report", () => {
    const answer = runDemoWorkflow("How did monthly revenue trend in 2026?");

    expect(answer.validation.isValid).toBe(true);
    expect(answer.execution.rowCount).toBeGreaterThan(0);
    expect(answer.trace.events.map((event) => event.label)).toContain("SQL executed");
    expect(answer.reportHtml).toContain("Validated SQL");
  });
});

