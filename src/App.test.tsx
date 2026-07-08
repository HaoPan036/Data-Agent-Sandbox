import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { topicCatalog } from "./topics/topicCatalog";

describe("App", () => {
  it("renders the public platform overview", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Make Data Agents Observable, Testable, and Governed"
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Data Agent Sandbox").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /New Topic/i })).toBeDisabled();
  });

  it("does not show fake SQL in this stage", () => {
    render(<App />);

    expect(screen.queryByText(/SELECT\s+/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/FROM\s+\?/i)).not.toBeInTheDocument();
  });
});

describe("TopicDetailPage", () => {
  it.each(topicCatalog)("renders topic detail for $name", (topic) => {
    render(<TopicDetailPage topic={topic} />);

    expect(screen.getByRole("heading", { name: "Information" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data Source Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sample Questions" })).toBeInTheDocument();
  });

  it("updates selected question when a sample question is clicked", () => {
    const topic = topicCatalog[1];
    const selectedQuestion = topic.sampleQuestions[2];

    render(<TopicDetailPage topic={topic} />);

    fireEvent.click(screen.getByRole("button", { name: selectedQuestion }));

    expect(screen.getByLabelText("Topic question")).toHaveValue(selectedQuestion);
  });

  it("shows the next-stage execution message when run is clicked", () => {
    render(<TopicDetailPage topic={topicCatalog[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(
      screen.getByText("Agent execution will be implemented in the next stage.")
    ).toBeInTheDocument();
  });
});
