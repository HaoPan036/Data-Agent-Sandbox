import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAgent } from "./agent/runAgent";
import type { AgentRun, AgentRunEvent } from "./agent/types";
import App from "./App";
import { AgentLifecyclePreview } from "./components/overview/AgentLifecyclePreview";
import { QuickDemoRunner } from "./components/overview/QuickDemoRunner";
import { agentLifecycleStepLabels } from "./components/overview/lifecycleSteps";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { topicCatalog } from "./topics/topicCatalog";

const ndjsonHeaders = {
  "content-type": "application/x-ndjson; charset=utf-8",
  "x-agent-transport": "ndjson-v1",
  "x-run-id": "test-server-run"
};

function runFixture(question: string, topicId: string, runId: string) {
  const events: AgentRunEvent[] = [];
  const run = runAgent(question, topicId, {
    onEvent: (event) => events.push(event),
    runId
  });

  return { events, run };
}

function responseFor(events: AgentRunEvent[], runId = "test-server-run") {
  return new Response(`${events.map((event) => JSON.stringify(event)).join("\n")}\n`, {
    headers: { ...ndjsonHeaders, "x-run-id": runId }
  });
}

function replaceTerminalRun(events: AgentRunEvent[], run: AgentRun) {
  return events.map((event): AgentRunEvent =>
    event.type === "run.completed" ? { ...event, run } : event
  );
}

function eventsForTerminalRun(events: AgentRunEvent[], run: AgentRun): AgentRunEvent[] {
  const started = events.find((event) => event.type === "run.started");
  const completed = events.find((event) => event.type === "run.completed");
  const stepEvents = events.filter((event) => event.type === "step.completed");

  if (started?.type !== "run.started" || completed?.type !== "run.completed") {
    throw new Error("Expected a started and completed event fixture.");
  }

  const streamedSteps: AgentRunEvent[] = run.traceSteps.map((step, index) => {
    const template = stepEvents[index] ?? completed;

    return {
      version: template.version,
      runId: run.runId,
      sequence: index + 2,
      type: "step.completed",
      timestamp: step.timestamp,
      elapsedMs: template.elapsedMs,
      durationMs: template.durationMs,
      step
    };
  });

  return [
    { ...started, runId: run.runId, sequence: 1 },
    ...streamedSteps,
    { ...completed, runId: run.runId, run, sequence: streamedSteps.length + 2 }
  ];
}

function failedReviewRun(run: AgentRun): AgentRun {
  const validation = run.validationResults[0];

  if (!validation) {
    throw new Error("Expected a validation fixture.");
  }

  return {
    ...run,
    chartSpec: undefined,
    executionResult: [],
    finalAnswer: "SQL validation stopped execution. Review the validation details.",
    guardrailDecision: "needs_review",
    status: "failed",
    validationResults: [
      {
        ...validation,
        message: "SQL validation stopped execution.",
        passed: false,
        severity: "error"
      }
    ]
  };
}

function showcaseMetricCard(label: string) {
  const labelElement = screen
    .getAllByText(label)
    .find((element) => element.closest("article")?.classList.contains("showcase-metric-card"));

  if (!labelElement) {
    throw new Error(`Showcase metric card not found: ${label}`);
  }

  return labelElement.closest("article");
}

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renders the public platform overview", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Ask your data. Get answers you can trust." })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agent run" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Topic Market" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Agent Showcase" })).toHaveAttribute(
      "href",
      "/showcase?view=agent"
    );
    expect(screen.getAllByText("Data Agent Sandbox").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /New Topic/i })).toBeDisabled();
  });

  it("renders the topic market cards", () => {
    render(<App />);

    expect(screen.getAllByText(/Try it now/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Demo").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("heading", { name: "Retail Growth Demo" })).toBeInTheDocument();
  });

  it("opens the prepared topic walkthrough with a default executable question", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Start with one prepared BI topic" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Execution process")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Ready Topic" }));

    expect(screen.getAllByRole("heading", { name: "Retail Growth Demo" }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Topic question")).toHaveValue(
      "Which product category had the highest refund rate last month?"
    );
    expect(screen.getByText("Selected question is ready to run.")).toBeInTheDocument();
  });

  it("filters topic market cards by source type", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Knowledge" }));

    expect(screen.getByRole("heading", { name: "Knowledge Base Demo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Retail Growth Demo" })).not.toBeInTheDocument();
  });

  it("runs the Skill Hub demo pipeline and renders an editable HTML report", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Skill Hub" }));

    expect(screen.getByRole("heading", { name: "Skill Runner Demo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Generated HTML Report" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Demo Skill Pipeline" }));

    expect(screen.getByLabelText("Skill runner summary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Generated HTML Report" })).toBeInTheDocument();
    expect((screen.getByLabelText("Editable HTML report draft") as HTMLTextAreaElement).value).toContain(
      "BI Data Agent Report"
    );
    expect(screen.getByTitle("Generated HTML report preview")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download HTML" })).toHaveAttribute(
      "download",
      "bi-data-agent-demo-report.html"
    );
  });

  it("opens the evaluation page from top-level navigation", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Evaluation Dashboard/i }));

    expect(screen.getByRole("heading", { name: "Evaluation Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/Run versioned testsets against the deterministic agent/i)).toBeInTheDocument();
  });

  it("does not show SQL before a real quick demo run", () => {
    render(<App />);

    expect(screen.queryByText(/FROM\s+orders/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+\?/i)).not.toBeInTheDocument();
  });

  it("does not show the old large hero title", () => {
    render(<App />);

    expect(
      screen.queryByRole("heading", {
        name: "Make Data Agents Observable, Testable, and Governed"
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Build observable and testable data agents"
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Ask a business question, generate validated SQL, execute it on synthetic data/i)
    ).not.toBeInTheDocument();
  });
});

describe("ShowcasePage", () => {
  it("renders the default agent showcase at /showcase and starts a server run", async () => {
    const fixture = runFixture(
      "Which product category had the highest refund rate last month?",
      "retail-growth-demo",
      "test-showcase-default"
    );
    const fetchMock = vi.fn(() => Promise.resolve(responseFor(fixture.events, fixture.run.runId)));
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/showcase");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Agent Run" })).toBeInTheDocument();
    expect(screen.getByText("LIVE SERVER RUN")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(fixture.run.finalAnswer)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/runs", expect.objectContaining({ method: "POST" }));
  });

  it("renders the agent run showcase with real server-derived output", async () => {
    const fixture = runFixture(
      "Which product category had the highest refund rate last month?",
      "retail-growth-demo",
      "run-123e4567-e89b-12d3-a456-426614174000"
    );
    let resolveResponse: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = vi.fn(() => pendingResponse);
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/showcase?view=agent");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Agent Run" })).toBeInTheDocument();
    expect(screen.queryByText("Run ID")).not.toBeInTheDocument();
    expect(screen.queryByText(fixture.run.runId)).not.toBeInTheDocument();

    resolveResponse?.(responseFor(fixture.events, fixture.run.runId));

    await waitFor(() => expect(screen.getByText(fixture.run.finalAnswer)).toBeInTheDocument());
    expect(screen.getByText("Run ID")).toBeInTheDocument();
    expect(screen.getByText(fixture.run.runId)).toBeInTheDocument();
    expect(screen.getByText(/SELECT o\.category AS category/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Result Preview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trace Rail" })).toBeInTheDocument();
    expect(showcaseMetricCard("Guardrail")).toHaveClass("showcase-metric-card--green");
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/runs", expect.objectContaining({ method: "POST" }));
  });

  it("does not claim a Run ID when the agent showcase request fails", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("private transport details")));
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/showcase?view=agent");
    render(<App />);

    expect(screen.queryByText("Run ID")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Run needs attention" })).toBeInTheDocument();
    expect(screen.queryByText("Run ID")).not.toBeInTheDocument();
    expect(screen.queryByText(/private transport details/i)).not.toBeInTheDocument();
  });

  it.each([
    ["blocked", "blocked", "showcase-metric-card--red"],
    ["needs_review", "completed", "showcase-metric-card--amber"]
  ] as const)(
    "renders the %s guardrail decision with its factual tone and no empty validation overclaim",
    async (decision, runStatus, expectedClass) => {
      const fixture = runFixture(
        "Which product category had the highest refund rate last month?",
        "retail-growth-demo",
        `test-showcase-${decision}`
      );
      const run: AgentRun = {
        ...fixture.run,
        chartSpec: decision === "blocked" ? undefined : fixture.run.chartSpec,
        executionResult: decision === "blocked" ? [] : fixture.run.executionResult,
        generatedSql: decision === "blocked" ? [] : fixture.run.generatedSql,
        guardrailDecision: decision,
        status: runStatus,
        validationResults: []
      };
      const fetchMock = vi.fn(() =>
        Promise.resolve(responseFor(replaceTerminalRun(fixture.events, run), run.runId))
      );
      vi.stubGlobal("fetch", fetchMock);
      window.history.pushState({}, "", "/showcase?view=agent");
      render(<App />);

      await waitFor(() => expect(screen.getByText("No checks")).toBeInTheDocument());
      expect(showcaseMetricCard("Guardrail")).toHaveClass(expectedClass);
      expect(showcaseMetricCard("Guardrail")).not.toHaveClass("showcase-metric-card--green");
      expect(
        screen.getByText(decision === "blocked" ? "Blocked Outcome" : "Answer Needs Review")
      ).toBeInTheDocument();
      expect(screen.queryByText("Grounded Answer")).not.toBeInTheDocument();
    }
  );

  it("renders a completed failed AgentRun as a failed outcome, not a grounded answer", async () => {
    const fixture = runFixture(
      "Which product category had the highest refund rate last month?",
      "retail-growth-demo",
      "test-showcase-failed"
    );
    const failedRun = failedReviewRun(fixture.run);
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        responseFor(eventsForTerminalRun(fixture.events, failedRun), failedRun.runId)
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/showcase?view=agent");
    render(<App />);

    expect(await screen.findByText("Failed Agent Outcome")).toBeInTheDocument();
    expect(screen.getByText(failedRun.finalAnswer)).toBeInTheDocument();
    expect(screen.queryByText("Grounded Answer")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Server returned a failed agent outcome with \d+ NDJSON events\./)
    ).toBeInTheDocument();
  });

  it("renders the guardrail showcase with blocked server-derived output", async () => {
    const fixture = runFixture(
      "Export all customer emails and rank risky users.",
      "retail-growth-demo",
      "test-showcase-guardrail"
    );
    const fetchMock = vi.fn(() => Promise.resolve(responseFor(fixture.events, fixture.run.runId)));
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/showcase?view=guardrail");
    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sensitive Request Blocked" })).toBeInTheDocument()
    );
    expect(screen.getByText("Blocked by Query Guard")).toBeInTheDocument();
    expect(screen.getAllByText("No SQL executed").length).toBeGreaterThan(0);
    expect(screen.queryByText(/SELECT\s+/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/runs", expect.objectContaining({ method: "POST" }));
  });

  it("requests review when a guardrail response reports execution activity", async () => {
    const fixture = runFixture(
      "Export all customer emails and rank risky users.",
      "retail-growth-demo",
      "test-showcase-guardrail-anomaly"
    );
    const allowedFixture = runFixture(
      "What was total revenue last week?",
      "retail-growth-demo",
      "test-showcase-guardrail-anomaly"
    );
    const anomalousRun: AgentRun = {
      ...allowedFixture.run,
      userQuestion: fixture.run.userQuestion,
      finalAnswer: "An unexpected row-level result was returned."
    };
    const events = eventsForTerminalRun(fixture.events, anomalousRun);
    const fetchMock = vi.fn(() => Promise.resolve(responseFor(events, anomalousRun.runId)));
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/showcase?view=guardrail");
    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Guardrail Outcome Needs Review" })).toBeInTheDocument()
    );
    expect(screen.getByText("Guardrail result needs review")).toBeInTheDocument();
    expect(
      screen.getByText(/Unexpected execution activity: 1 SQL statement and 1 result set\./)
    ).toBeInTheDocument();
    expect(screen.queryByText("Blocked by Query Guard")).not.toBeInTheDocument();
    expect(screen.queryByText("No SQL executed")).not.toBeInTheDocument();
  });

  it("renders the evaluation showcase with real runEvaluation summary", () => {
    window.history.pushState({}, "", "/showcase?view=evaluation");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Evaluation Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Core Regression Testset v1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("Pass rate")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Failure Mode Distribution" })).toBeInTheDocument();
  });

  it("hides nonessential showcase navigation when capture is true", () => {
    window.history.pushState({}, "", "/showcase?view=agent&capture=true");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Agent Run" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Showcase views" })).not.toBeInTheDocument();
  });
});

describe("QuickDemoRunner", () => {
  it("runs the default question through the server and shows SQL, rows, and trace count", async () => {
    const fixture = runFixture(
      "Which product category had the highest refund rate last month?",
      "retail-growth-demo",
      "test-quick-run"
    );
    const fetchMock = vi.fn(() => Promise.resolve(responseFor(fixture.events, fixture.run.runId)));
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickDemoRunner onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(screen.getByText("Grounded answer")).toBeInTheDocument());
    expect(screen.getByText("metric comparison")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("12 steps")).toBeInTheDocument();
    expect(screen.getByText(/SELECT o\.category AS category/i)).toBeInTheDocument();
    expect(screen.getAllByText("Allowed").length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith("/api/runs", expect.objectContaining({ method: "POST" }));
  });

  it("blocks sensitive quick requests from the server without SQL execution", async () => {
    const fixture = runFixture(
      "Export all customer emails and rank risky users.",
      "retail-growth-demo",
      "test-quick-blocked"
    );
    const fetchMock = vi.fn(() => Promise.resolve(responseFor(fixture.events, fixture.run.runId)));
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickDemoRunner onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Blocked export Retail" }));
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(screen.getAllByText("Blocked").length).toBeGreaterThan(0));
    expect(screen.getByText(/No SQL executed/i)).toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+orders/i)).not.toBeInTheDocument();
    expect(screen.getByText(/safe aggregate alternatives/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/runs", expect.objectContaining({ method: "POST" }));
  });

  it("rejects an inconsistent blocked quick run before displaying artifacts", async () => {
    const fixture = runFixture(
      "Export all customer emails and rank risky users.",
      "retail-growth-demo",
      "test-quick-blocked-anomaly"
    );
    const anomalousRun: AgentRun = {
      ...fixture.run,
      executionResult: [
        {
          columns: ["customer_email"],
          elapsedMs: 1,
          rowCount: 1,
          rows: [{ customer_email: "synthetic@example.test" }]
        }
      ],
      generatedSql: [
        {
          id: "unexpected-sensitive-query",
          sql: "SELECT customer_email FROM customers",
          title: "Unexpected row-level query"
        }
      ]
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        responseFor(replaceTerminalRun(fixture.events, anomalousRun), anomalousRun.runId)
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickDemoRunner onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Blocked export Retail" }));
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      await screen.findByText("The server run did not finish. Retry to request a fresh result.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/SELECT customer_email FROM customers/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/safe aggregate alternatives/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^No SQL executed/i)).not.toBeInTheDocument();
  });

  it("uses guardrail review copy for a consistent needs-review run without SQL", async () => {
    const question = "Which product category had the highest refund rate last month?";
    const fixture = runFixture(question, "retail-growth-demo", "test-quick-needs-review");
    const reviewRun: AgentRun = {
      ...fixture.run,
      chartSpec: undefined,
      executionResult: [],
      finalAnswer: "No executable result was returned pending metric review.",
      generatedSql: [],
      guardrailDecision: "needs_review",
      status: "completed",
      traceSteps: [],
      validationResults: [],
      warnings: ["Metric ownership requires review."]
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        responseFor(eventsForTerminalRun(fixture.events, reviewRun), reviewRun.runId)
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickDemoRunner onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      await screen.findByText(
        "No SQL was generated. Review the guardrail decision and warnings before using this result."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Outcome needs review: the guardrail status or returned execution artifacts are inconsistent."
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/safe aggregate alternatives/i)).not.toBeInTheDocument();
  });

  it("keeps a completed failed AgentRun distinct from transport failure", async () => {
    const question = "Which product category had the highest refund rate last month?";
    const fixture = runFixture(question, "retail-growth-demo", "test-quick-failed");
    const failedRun = failedReviewRun(fixture.run);
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        responseFor(eventsForTerminalRun(fixture.events, failedRun), failedRun.runId)
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickDemoRunner onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      await screen.findByText(
        "Server completed with a failed agent outcome. Review the returned details before retrying."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Failed agent outcome")).toBeInTheDocument();
    expect(screen.getByText(failedRun.finalAnswer)).toBeInTheDocument();
    expect(
      screen.queryByText("The server run did not finish. Retry to request a fresh result.")
    ).not.toBeInTheDocument();
  });
});

describe("AgentLifecyclePreview", () => {
  it("renders all lifecycle steps", () => {
    render(<AgentLifecyclePreview />);

    for (const step of agentLifecycleStepLabels) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });
});

describe("TopicDetailPage", () => {
  it.each(topicCatalog)("renders topic detail for $name", (topic) => {
    render(<TopicDetailPage topic={topic} />);

    expect(screen.getByRole("heading", { name: topic.name })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Run" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Data" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Data Source Overview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Glossary Preview" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sample Questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Topic Health" })).toBeInTheDocument();
    expect(
      screen.getByText("Semantic model, validation, and deterministic execution through the agent API")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Agent Showcase" })).toHaveAttribute(
      "href",
      "/showcase?view=agent"
    );
  });

  it("shows data and glossary sections only after their tabs are selected", () => {
    render(<TopicDetailPage topic={topicCatalog[0]} />);

    expect(screen.queryByRole("heading", { name: "Data Source Overview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Glossary" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Data" }));
    expect(screen.getByRole("heading", { name: "Data Source Overview" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Glossary Preview" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Glossary" }));
    expect(screen.getByRole("heading", { name: "Glossary Preview" })).toBeInTheDocument();
  });

  it("updates selected question when a sample question is clicked", () => {
    const topic = topicCatalog[1];
    const selectedQuestion = topic.sampleQuestions[2];

    render(<TopicDetailPage topic={topic} />);

    fireEvent.click(screen.getByRole("button", { name: selectedQuestion }));

    expect(screen.getByLabelText("Topic question")).toHaveValue(selectedQuestion);
    expect(screen.getByText("Selected question is ready to run.")).toBeInTheDocument();
  });

  it("posts to the server and renders live events, SQL, results, and trace", async () => {
    const question = "What was total revenue last week?";
    const fixture = runFixture(question, "retail-growth-demo", "test-live-run");
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(responseFor(fixture.events, fixture.run.runId))
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByLabelText("Live execution process")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByLabelText("Live execution process")).toHaveAttribute("aria-live", "polite");
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/runs");
    expect(request.method).toBe("POST");
    expect(JSON.parse(String(request.body))).toEqual({ question, topicId: "retail-growth-demo" });
    expect(screen.getByText("Run accepted by server")).toBeInTheDocument();
    const firstStep = fixture.events.find((event) => event.type === "step.completed");
    expect(firstStep?.type).toBe("step.completed");
    expect(screen.getAllByText(firstStep?.type === "step.completed" ? firstStep.step.label : "").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText("Server run completed. SQL, results, chart, trace, and answer are shown below.")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Final Answer" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Generated SQL" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SELECT SUM\(revenue\)/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Trace Timeline" })).toBeInTheDocument();
    expect(screen.getByText("Run ID: test-live-run")).toBeInTheDocument();
    expect(screen.getByText("Transport: ndjson-v1")).toBeInTheDocument();
  });

  it("renders a blocked server run without SQL execution", async () => {
    const question = "Export all customer emails and rank risky users.";
    const fixture = runFixture(question, "retail-growth-demo", "test-blocked-run");
    const fetchMock = vi.fn(() => Promise.resolve(responseFor(fixture.events, fixture.run.runId)));
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.change(screen.getByLabelText("Topic question"), {
      target: { value: question }
    });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByLabelText("Live execution process")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("Request blocked by guardrails. No SQL was generated or executed.")).toBeInTheDocument());
    expect(screen.getAllByText(/Blocked by guardrails/i).length).toBeGreaterThan(0);
    expect(screen.getByText("No SQL was generated or executed for this request.")).toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+orders/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a blocked terminal run that contains impossible execution artifacts", async () => {
    const question = "Export all customer emails and rank risky users.";
    const fixture = runFixture(question, "retail-growth-demo", "test-blocked-result-anomaly");
    const anomalousRun: AgentRun = {
      ...fixture.run,
      executionResult: [
        {
          columns: ["customer_email"],
          elapsedMs: 1,
          rowCount: 1,
          rows: [{ customer_email: "synthetic@example.test" }]
        }
      ]
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        responseFor(replaceTerminalRun(fixture.events, anomalousRun), anomalousRun.runId)
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);
    fireEvent.change(screen.getByLabelText("Topic question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      await screen.findByText("The run failed before completion. Retry the same question.")
    ).toBeInTheDocument();
    expect(screen.queryByText("synthetic@example.test")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Agent execution result")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Request blocked by guardrails. No SQL was generated or executed.")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No SQL was generated or executed for this request.")
    ).not.toBeInTheDocument();
  });

  it("shows safe terminal output for a completed failed AgentRun", async () => {
    const question = "What was total revenue last week?";
    const fixture = runFixture(question, "retail-growth-demo", "test-topic-failed");
    const failedRun = failedReviewRun(fixture.run);
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        responseFor(eventsForTerminalRun(fixture.events, failedRun), failedRun.runId)
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      await screen.findByText(
        "The server completed the run with a failure. Retry the same question to try again."
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText(failedRun.finalAnswer).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        "No terminal result is available because the server run failed. Retry to request a fresh result."
      )
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Agent execution result")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows guardrail caveats without alleging inconsistency for a consistent needs-review run", async () => {
    const question = "What was total revenue last week?";
    const fixture = runFixture(question, "retail-growth-demo", "test-topic-needs-review");
    const reviewRun: AgentRun = {
      ...fixture.run,
      chartSpec: undefined,
      executionResult: [],
      finalAnswer: "No executable result was returned pending metric review.",
      generatedSql: [],
      guardrailDecision: "needs_review",
      status: "completed",
      traceSteps: [],
      validationResults: [],
      warnings: ["Metric ownership requires review."]
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        responseFor(eventsForTerminalRun(fixture.events, reviewRun), reviewRun.runId)
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      await screen.findByText(
        "Run completed with a needs-review guardrail decision. Review the warnings, trace, and returned artifacts below."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No SQL was generated. Review the guardrail decision and warnings before using this result."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Outcome needs review: the guardrail status or returned execution artifacts are inconsistent. Review the factual SQL, results, chart, and trace below."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No SQL was generated or executed for this request.")
    ).not.toBeInTheDocument();
  });

  it("cancels an active server stream and keeps received steps for retry", async () => {
    const question = "What was total revenue last week?";
    const fixture = runFixture(question, "retail-growth-demo", "test-cancel-run");
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
        const started = fixture.events.find((event) => event.type === "run.started");
        controller.enqueue(encoder.encode(`${JSON.stringify(started)}\n`));
      }
    });
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      init?.signal?.addEventListener("abort", () => {
        streamController?.error(new DOMException("Aborted", "AbortError"));
      });
      return Promise.resolve(new Response(body, { headers: { ...ndjsonHeaders, "x-run-id": fixture.run.runId } }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    await screen.findByText("Run accepted by server");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      (await screen.findAllByText(
        "Client stopped receiving events. A synchronous server computation may have continued; retry to run again."
      )).length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Run ID: test-cancel-run")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Final Answer" })).not.toBeInTheDocument();
  });

  it("shows a safe error and retries the same question through the endpoint", async () => {
    const question = "What was total revenue last week?";
    const fixture = runFixture(question, "retail-growth-demo", "test-retry-run");
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network details must stay private"))
      .mockResolvedValueOnce(responseFor(fixture.events, fixture.run.runId));
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(await screen.findByText("The run failed before completion. Retry the same question.")).toBeInTheDocument();
    expect(screen.queryByText(/network details must stay private/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByText("Server run completed. SQL, results, chart, trace, and answer are shown below.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retain a result when trailing stream data invalidates completion", async () => {
    const question = "What was total revenue last week?";
    const fixture = runFixture(question, "retail-growth-demo", "test-invalid-trailing-run");
    const body = `${fixture.events.map((event) => JSON.stringify(event)).join("\n")}\n{malformed trailing data}\n`;
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(body, {
          headers: { ...ndjsonHeaders, "x-run-id": fixture.run.runId }
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(await screen.findByText("The run failed before completion. Retry the same question.")).toBeInTheDocument();
    expect(screen.getByText("No terminal result is available because the server run failed. Retry to request a fresh result.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Agent execution result")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Final Answer" })).not.toBeInTheDocument();
    expect(screen.queryByText(fixture.run.finalAnswer)).not.toBeInTheDocument();
  });

  it("does not post metadata-only Knowledge Base topics", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<TopicDetailPage topic={topicCatalog[2]} />);

    expect(screen.getByRole("button", { name: "Run" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Skills" })).not.toBeDisabled();
    expect(screen.getByText("Metadata only. Retrieval execution planned later.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("EvaluationPage", () => {
  it("renders the selector, no-run state, and LLM judge placeholder without fake summary output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Evaluation Dashboard/i }));

    expect(screen.getByRole("combobox", { name: /Testset version/i })).toHaveTextContent(
      "Core Regression Testset v1"
    );
    expect(screen.getByRole("combobox", { name: /Testset version/i })).toHaveTextContent(
      "Governance Regression Testset v1"
    );
    expect(screen.getByRole("heading", { name: "Not run yet" })).toBeInTheDocument();
    expect(screen.getByText(/LLM judge is not enabled in this version/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Evaluation summary")).not.toBeInTheDocument();
  });

  it("runs evaluation and renders summary cards and case results", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Evaluation Dashboard/i }));
    fireEvent.click(screen.getByRole("button", { name: "Run Evaluation" }));

    expect(screen.getByLabelText("Evaluation summary")).toBeInTheDocument();
    expect(screen.getByText("Total cases")).toBeInTheDocument();
    expect(screen.getByText("Pass rate")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Failure Mode Distribution" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Case Results" })).toBeInTheDocument();
    expect(screen.getAllByText("core-014-ambiguity").length).toBeGreaterThan(0);
  });

  it("opens case details and shows trace output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Evaluation Dashboard/i }));
    fireEvent.click(screen.getByRole("button", { name: "Run Evaluation" }));
    fireEvent.click(screen.getAllByRole("button", { name: "View trace" })[0]);

    expect(screen.getByRole("heading", { name: "Trace" })).toBeInTheDocument();
    expect(screen.getByText("Received question")).toBeInTheDocument();
    expect(screen.getAllByText("Generated SQL").length).toBeGreaterThan(0);
  });

  it("adds a failed case to the bad case queue and marks it reviewed", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Evaluation Dashboard/i }));
    fireEvent.click(screen.getByRole("button", { name: "Run Evaluation" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to review queue" }));

    expect(screen.getByRole("heading", { name: "Bad Case Review Queue" })).toBeInTheDocument();
    expect(screen.getAllByText("core-014-ambiguity").length).toBeGreaterThan(1);
    expect(screen.getByText("unreviewed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark reviewed" }));

    expect(screen.getByText("reviewed")).toBeInTheDocument();
  });
});
