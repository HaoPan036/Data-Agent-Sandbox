import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the sandbox landing experience", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "BI Data Agent Sandbox" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run Demo Question/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open Evaluation/i })).toBeInTheDocument();
  });
});

