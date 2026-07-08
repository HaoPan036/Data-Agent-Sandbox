import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { AgentLifecyclePreview } from "./components/overview/AgentLifecyclePreview";
import { QuickDemoRunner } from "./components/overview/QuickDemoRunner";
import { agentLifecycleStepLabels } from "./components/overview/lifecycleSteps";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { topicCatalog } from "./topics/topicCatalog";

describe("App", () => {
  it("renders the public platform overview", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Run a Governed Data Agent"
      })
    ).toBeInTheDocument();
    expect(screen.getByText("LIVE DETERMINISTIC DEMO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run a supported question" })).toBeInTheDocument();
    expect(screen.getAllByText("Data Agent Sandbox").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /New Topic/i })).toBeDisabled();
  });

  it("renders compact topic card metadata", () => {
    render(<App />);

    expect(screen.getAllByText("Tables").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Metrics").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Questions").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Open").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Run sample").length).toBeGreaterThanOrEqual(3);
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
    expect(screen.getByRole("heading", { name: "Information" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data Source Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sample Questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Topic Health" })).toBeInTheDocument();
    expect(screen.getByText("Supported now")).toBeInTheDocument();
  });

  it("updates selected question when a sample question is clicked", () => {
    const topic = topicCatalog[1];
    const selectedQuestion = topic.sampleQuestions[2];

    render(<TopicDetailPage topic={topic} />);

    fireEvent.click(screen.getByRole("button", { name: selectedQuestion }));

    expect(screen.getByLabelText("Topic question")).toHaveValue(selectedQuestion);
    expect(screen.getByText("Selected question is ready to run.")).toBeInTheDocument();
  });

  it("runs deterministic SQL when Run is clicked", () => {
    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      screen.getByText(
        "Deterministic run completed. SQL, results, chart, trace, and answer are shown below."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Final Answer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Generated SQL" })).toBeInTheDocument();
    expect(screen.getByText(/SELECT SUM\(revenue\)/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trace Timeline" })).toBeInTheDocument();
  });

  it("blocks sensitive customer export requests without SQL execution", () => {
    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.change(screen.getByLabelText("Topic question"), {
      target: { value: "Export all customer emails and rank risky users." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByText("Request blocked by guardrails. See the run details below.")).toBeInTheDocument();
    expect(screen.getAllByText(/Blocked by guardrails/i).length).toBeGreaterThan(0);
    expect(screen.getByText("No SQL was generated or executed for this request.")).toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+orders/i)).not.toBeInTheDocument();
  });
});

describe("README", () => {
  it("contains English and Chinese stage sections", () => {
    const readme = readFileSync(`${process.cwd()}/README.md`, "utf8");

    expect(readme).toContain("Visual Product Shell Status");
    expect(readme).toContain("视觉产品外壳状态");
  });
});
