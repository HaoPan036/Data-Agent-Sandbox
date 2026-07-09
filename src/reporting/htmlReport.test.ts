import { describe, expect, it } from "vitest";
import { runAgent } from "../agent/runAgent";
import { createAgentRunHtmlReport } from "./htmlReport";

describe("createAgentRunHtmlReport", () => {
  it("renders a self-contained report from a real AgentRun", () => {
    const run = runAgent(
      "Which product category had the highest refund rate last month?",
      "retail-growth-demo",
      {
        createdAt: "2026-07-09T00:00:00.000Z",
        runId: "report-test-run"
      }
    );
    const html = createAgentRunHtmlReport(run);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("BI Data Agent Report");
    expect(html).toContain("contenteditable=\"true\"");
    expect(html).toContain("Validated SQL");
    expect(html).toContain("Validation Results");
    expect(html).toContain("Executed Results");
    expect(html).toContain("Trace");
    expect(html).toContain("SELECT o.category AS category");
    expect(html).toContain("report-test-run");
  });

  it("escapes user-controlled report text", () => {
    const run = runAgent("What was total revenue last week?", "retail-growth-demo");
    const html = createAgentRunHtmlReport({
      ...run,
      finalAnswer: "<script>alert('answer')</script>",
      userQuestion: "<img src=x onerror=alert('question') />"
    });

    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;alert(&#039;answer&#039;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(&#039;question&#039;) /&gt;");
  });
});
