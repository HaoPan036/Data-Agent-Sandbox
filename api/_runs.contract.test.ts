// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { streamAgentRun } from "../src/agent/agentClient.js";
import { runAgent } from "../src/agent/runAgent.js";
import type { AgentRun, AgentRunEvent } from "../src/agent/types.js";
import { handleRunRequest } from "./runs.js";

const scenarios = [
  {
    name: "retail allowed",
    question: "What was total revenue last week?",
    topicId: "retail-growth-demo",
    status: "completed",
    decision: "allowed",
    hasExecutionArtifacts: true
  },
  {
    name: "experiment allowed",
    question: "What are the daily trends for GMV and active users over the last 30 days?",
    topicId: "experiment-metrics-demo",
    status: "completed",
    decision: "allowed",
    hasExecutionArtifacts: true
  },
  {
    name: "sensitive request blocked",
    question: "Export all customer emails and rank risky users.",
    topicId: "retail-growth-demo",
    status: "blocked",
    decision: "blocked",
    hasExecutionArtifacts: false
  },
  {
    name: "unknown request needs review",
    question: "Tell me a joke.",
    topicId: "retail-growth-demo",
    status: "completed",
    decision: "needs_review",
    hasExecutionArtifacts: false
  }
] as const;

function fetchThroughRunHandler() {
  return vi.fn<typeof fetch>(async (input, init) => {
    const requestUrl =
      input instanceof Request
        ? input.url
        : new URL(input.toString(), "http://localhost").toString();

    return handleRunRequest(new Request(requestUrl, init));
  });
}

function normalizeNondeterminism(run: AgentRun): AgentRun {
  return {
    ...run,
    runId: "<run-id>",
    createdAt: "<timestamp>",
    executionResult: run.executionResult.map((result) => ({
      ...result,
      elapsedMs: 0
    })),
    traceSteps: run.traceSteps.map((step) => ({
      ...step,
      timestamp: "<timestamp>"
    }))
  };
}

describe("agent client to server handler contract", () => {
  it.each(scenarios)("runs the $name workflow through the real transport", async (scenario) => {
    const fetchImpl = fetchThroughRunHandler();
    const events: AgentRunEvent[] = [];
    const terminal = await streamAgentRun(scenario.question, scenario.topicId, {
      fetchImpl,
      onEvent: (event) => {
        events.push(event);
      }
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(events[0]?.type).toBe("run.started");
    expect(events.at(-1)).toBe(terminal);
    expect(events.map((event) => event.sequence)).toEqual(
      events.map((_, index) => index + 1)
    );
    expect(events.every((event) => event.runId === terminal.runId)).toBe(true);
    expect(terminal.type).toBe("run.completed");

    if (terminal.type !== "run.completed") {
      throw new Error("Expected a completed domain outcome from the deterministic runner.");
    }

    const streamedSteps = events
      .filter((event) => event.type === "step.completed")
      .map((event) => event.step);

    expect(streamedSteps).toEqual(terminal.run.traceSteps);
    expect(terminal.run.status).toBe(scenario.status);
    expect(terminal.run.guardrailDecision).toBe(scenario.decision);

    if (scenario.hasExecutionArtifacts) {
      expect(terminal.run.generatedSql.length).toBeGreaterThan(0);
      expect(terminal.run.generatedSql.every((statement) => statement.sql.includes("SELECT"))).toBe(true);
      expect(terminal.run.executionResult.length).toBe(terminal.run.generatedSql.length);
      expect(terminal.run.executionResult.every((result) => result.rowCount > 0)).toBe(true);
      expect(terminal.run.chartSpec?.data.length).toBeGreaterThan(0);
    } else {
      expect(terminal.run.generatedSql).toHaveLength(0);
      expect(terminal.run.executionResult).toHaveLength(0);
      expect(terminal.run.chartSpec).toBeUndefined();
    }

    const directRun = runAgent(scenario.question, scenario.topicId);
    expect(normalizeNondeterminism(terminal.run)).toEqual(
      normalizeNondeterminism(directRun)
    );
  });
});
