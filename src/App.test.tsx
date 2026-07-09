import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAgent } from "./agent/runAgent";
import App from "./App";
import { AgentLifecyclePreview } from "./components/overview/AgentLifecyclePreview";
import { QuickDemoRunner } from "./components/overview/QuickDemoRunner";
import { agentLifecycleStepLabels } from "./components/overview/lifecycleSteps";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { topicCatalog } from "./topics/topicCatalog";

beforeEach(() => {
  window.history.pushState({}, "", "/");
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
  it("renders the default agent showcase at /showcase", () => {
    window.history.pushState({}, "", "/showcase");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Agent Run" })).toBeInTheDocument();
    expect(screen.getByText("LIVE DETERMINISTIC RUN")).toBeInTheDocument();
  });

  it("renders the agent run showcase with real runAgent output", () => {
    const run = runAgent(
      "Which product category had the highest refund rate last month?",
      "retail-growth-demo",
      { runId: "test-showcase-agent" }
    );
    window.history.pushState({}, "", "/showcase?view=agent");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Agent Run" })).toBeInTheDocument();
    expect(screen.getByText(run.finalAnswer)).toBeInTheDocument();
    expect(screen.getByText(/SELECT o\.category AS category/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Result Preview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trace Rail" })).toBeInTheDocument();
  });

  it("renders the guardrail showcase with blocked real runAgent output", () => {
    window.history.pushState({}, "", "/showcase?view=guardrail");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Sensitive Request Blocked" })).toBeInTheDocument();
    expect(screen.getByText("Blocked by Query Guard")).toBeInTheDocument();
    expect(screen.getAllByText("No SQL executed").length).toBeGreaterThan(0);
    expect(screen.queryByText(/SELECT\s+/i)).not.toBeInTheDocument();
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
  it("runs the default question through runAgent and shows SQL, rows, and trace count", () => {
    render(<QuickDemoRunner onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByText("Grounded answer")).toBeInTheDocument();
    expect(screen.getByText("metric comparison")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("12 steps")).toBeInTheDocument();
    expect(screen.getByText(/SELECT o\.category AS category/i)).toBeInTheDocument();
    expect(screen.getAllByText("Allowed").length).toBeGreaterThan(0);
  });

  it("blocks sensitive quick requests without SQL execution", () => {
    render(<QuickDemoRunner onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Blocked export Retail" }));
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getAllByText("Blocked").length).toBeGreaterThan(0);
    expect(screen.getByText(/No SQL executed/i)).toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+orders/i)).not.toBeInTheDocument();
    expect(screen.getByText(/safe aggregate alternatives/i)).toBeInTheDocument();
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

  it("runs deterministic SQL when Run is clicked", async () => {
    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByLabelText("Live execution process")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Running..." })).toBeDisabled();
    expect(screen.getByText("Input captured")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(
          screen.getByText(
            "Deterministic run completed. SQL, results, chart, trace, and answer are shown below."
          )
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(screen.getByRole("heading", { name: "Final Answer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Generated SQL" })).toBeInTheDocument();
    expect(screen.getAllByText(/SELECT SUM\(revenue\)/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Trace Timeline" })).toBeInTheDocument();
  });

  it("blocks sensitive customer export requests without SQL execution", async () => {
    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.change(screen.getByLabelText("Topic question"), {
      target: { value: "Export all customer emails and rank risky users." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByLabelText("Live execution process")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText("Request blocked by guardrails. See the run details below.")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(screen.getAllByText(/Blocked by guardrails/i).length).toBeGreaterThan(0);
    expect(screen.getByText("No SQL was generated or executed for this request.")).toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+orders/i)).not.toBeInTheDocument();
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

describe("README", () => {
  it("contains English and Chinese stage sections", () => {
    const readme = readFileSync(`${process.cwd()}/README.md`, "utf8");

    expect(readme).toContain("Visual Product Shell Status");
    expect(readme).toContain("视觉产品外壳状态");
    expect(readme).toContain("Evaluation Dashboard");
    expect(readme).toContain("评估面板");
    expect(readme).toContain("Screenshot Showcase");
    expect(readme).toContain("作品集截图页面");
  });
});
