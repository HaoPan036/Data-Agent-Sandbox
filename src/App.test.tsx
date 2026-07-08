import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import App from "./App";
import { AgentLifecyclePreview } from "./components/overview/AgentLifecyclePreview";
import { agentLifecycleStepLabels } from "./components/overview/lifecycleSteps";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { topicCatalog } from "./topics/topicCatalog";

describe("App", () => {
  it("renders the public platform overview", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Build observable and testable data agents"
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Data Agent Sandbox").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /New Topic/i })).toBeDisabled();
  });

  it("renders topic card metadata", () => {
    render(<App />);

    expect(screen.getAllByText("Sources").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Glossary").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Questions").length).toBeGreaterThanOrEqual(3);
  });

  it("does not show fake SQL in this stage", () => {
    render(<App />);

    expect(screen.queryByText(/FROM\s+orders/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+\?/i)).not.toBeInTheDocument();
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
