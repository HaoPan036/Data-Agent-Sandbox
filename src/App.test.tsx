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

    expect(screen.queryByText(/SELECT\s+/i)).not.toBeInTheDocument();
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
    expect(screen.getAllByText("Not wired yet").length).toBeGreaterThan(0);
  });

  it("updates selected question when a sample question is clicked", () => {
    const topic = topicCatalog[1];
    const selectedQuestion = topic.sampleQuestions[2];

    render(<TopicDetailPage topic={topic} />);

    fireEvent.click(screen.getByRole("button", { name: selectedQuestion }));

    expect(screen.getByLabelText("Topic question")).toHaveValue(selectedQuestion);
    expect(
      screen.getByText(
        "Selected question is ready. Execution will be implemented in the next stage."
      )
    ).toBeInTheDocument();
  });

  it("shows the next-stage execution message when run is clicked", () => {
    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      screen.getByText(
        "Execution is not wired yet. Next stage connects this question to deterministic workflows."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/SELECT\s+/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/final answer/i)).not.toBeInTheDocument();
  });
});

describe("README", () => {
  it("contains English and Chinese stage sections", () => {
    const readme = readFileSync(`${process.cwd()}/README.md`, "utf8");

    expect(readme).toContain("Visual Product Shell Status");
    expect(readme).toContain("视觉产品外壳状态");
  });
});
