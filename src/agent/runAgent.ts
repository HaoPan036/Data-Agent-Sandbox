import { generateBlockedAnswer, generateGroundedAnswer, generateUnknownAnswer } from "./answerGenerator";
import { buildChartSpec } from "./chartSpec";
import { classifyIntent } from "./intentRouter";
import { executeAgentSql } from "./sqlExecutor";
import { generateAgentSql } from "./sqlGenerator";
import { hasValidationErrors, validateAgentSql } from "./sqlValidator";
import { createTraceStep } from "./trace";
import { AGENT_RUN_EVENT_VERSION } from "./types";
import type {
  AgentRun,
  AgentRunClock,
  AgentRunEvent,
  AgentRunOptions,
  AgentTraceStep,
  GuardrailDecision
} from "./types";

function createRunId() {
  const webCrypto = globalThis.crypto;

  if (typeof webCrypto?.randomUUID === "function") {
    try {
      return `run-${webCrypto.randomUUID()}`;
    } catch {
      // Fall through to getRandomValues when randomUUID is unavailable at runtime.
    }
  }

  if (typeof webCrypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `run-${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  throw new Error("Web Crypto is unavailable; provide AgentRunOptions.runId.");
}

function createMonotonicClock(rawClock: AgentRunClock): AgentRunClock {
  let lastTimestampMs: number | undefined;

  return () => {
    let timestampMs: number;

    try {
      timestampMs = rawClock();
    } catch {
      timestampMs = Number.NaN;
    }

    if (!Number.isFinite(timestampMs)) {
      try {
        timestampMs = Date.now();
      } catch {
        timestampMs = lastTimestampMs ?? 0;
      }
    }

    if (!Number.isFinite(timestampMs)) {
      timestampMs = lastTimestampMs ?? 0;
    }

    if (lastTimestampMs !== undefined) {
      timestampMs = Math.max(lastTimestampMs, timestampMs);
    }

    lastTimestampMs = timestampMs;
    return timestampMs;
  };
}

function notify(observer: ((event: AgentRunEvent) => void) | undefined, event: AgentRunEvent) {
  try {
    observer?.(event);
  } catch {
    // Observers are diagnostic hooks and must not affect the run.
  }
}

function createRunEventEmitter(
  runId: string,
  startedAtMs: number,
  clock: AgentRunClock,
  observer?: (event: AgentRunEvent) => void
) {
  let sequence = 0;
  let previousEventAtMs = startedAtMs;
  let terminalEmitted = false;

  function timing(timestampMs: number) {
    const eventTiming = {
      version: AGENT_RUN_EVENT_VERSION,
      runId,
      sequence: sequence + 1,
      timestamp: new Date(timestampMs).toISOString(),
      elapsedMs: Math.max(0, timestampMs - startedAtMs),
      durationMs: sequence === 0 ? 0 : Math.max(0, timestampMs - previousEventAtMs)
    };

    sequence += 1;
    previousEventAtMs = timestampMs;

    return eventTiming;
  }

  return {
    started(question: string, topicId: string) {
      notify(observer, {
        ...timing(startedAtMs),
        type: "run.started",
        question,
        topicId
      });
    },
    stepCompleted(step: AgentTraceStep, completedAtMs: number) {
      notify(observer, {
        ...timing(completedAtMs),
        type: "step.completed",
        step
      });
    },
    completed(run: AgentRun) {
      if (terminalEmitted) {
        return;
      }

      const event: AgentRunEvent = {
        ...timing(clock()),
        type: "run.completed",
        run
      };

      terminalEmitted = true;
      notify(observer, event);
    },
    failed(error: unknown) {
      if (terminalEmitted) {
        return;
      }

      terminalEmitted = true;

      notify(observer, {
        ...timing(clock()),
        type: "run.failed",
        error:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { name: "Error", message: String(error) }
      });
    },
    hasTerminalEvent() {
      return terminalEmitted;
    }
  };
}

function traceBuilder(
  clock: AgentRunClock,
  onStepCompleted: (step: AgentTraceStep, completedAtMs: number) => void
) {
  const steps: AgentTraceStep[] = [];

  return {
    add(label: string, status: AgentTraceStep["status"], message: string, details?: AgentTraceStep["details"]) {
      const completedAtMs = clock();
      const step = createTraceStep(
        steps.length + 1,
        label,
        status,
        message,
        details,
        new Date(completedAtMs).toISOString()
      );

      steps.push(step);
      onStepCompleted(step, completedAtMs);
    },
    steps
  };
}

function decideGuardrail(
  blocked: boolean,
  hasErrors: boolean,
  warnings: string[]
): GuardrailDecision {
  if (blocked) {
    return "blocked";
  }

  if (hasErrors || warnings.length > 0) {
    return "needs_review";
  }

  return "allowed";
}

export function runAgent(question: string, topicId: string, options: AgentRunOptions = {}): AgentRun {
  const clock = createMonotonicClock(options.clock ?? Date.now);
  const startedAtMs = clock();
  const createdAt = options.createdAt ?? new Date(startedAtMs).toISOString();
  const runId = options.runId ?? createRunId();
  const userQuestion = question.trim();
  const events = createRunEventEmitter(runId, startedAtMs, clock, options.onEvent);
  const trace = traceBuilder(clock, events.stepCompleted);

  try {
    events.started(userQuestion, topicId);

    trace.add("Received question", "completed", "Captured the user question from the topic composer.", {
      question: userQuestion
    });

    const routedIntent = classifyIntent(userQuestion);

    if (routedIntent.intent === "governance_sensitive_request") {
      trace.add("Classified intent", "completed", "Matched the prompt to a governance-sensitive request.", {
        intent: routedIntent.intent,
        matchedRules: routedIntent.matchedRules
      });
      trace.add("Risk detected", "blocked", "Detected user-level export or sensitive-record access.", {
        question: userQuestion
      });
      trace.add("Guardrail blocked", "blocked", "Blocked SQL generation and execution.", {
        decision: "blocked"
      });
      trace.add("Safe alternative generated", "completed", "Returned aggregate public-demo alternatives.");

      const run: AgentRun = {
        runId,
        status: "blocked",
        topicId,
        userQuestion,
        intent: routedIntent.intent,
        selectedMetrics: [],
        selectedTables: [],
        generatedSql: [],
        validationResults: [],
        executionResult: [],
        traceSteps: trace.steps,
        warnings: ["Sensitive or user-level export requests are blocked."],
        guardrailDecision: "blocked",
        finalAnswer: generateBlockedAnswer(),
        suggestedFollowUps: [
          "Show aggregated revenue by region.",
          "Count masked customers by segment.",
          "Explain the sensitive data policy."
        ],
        createdAt
      };

      events.completed(run);
      return run;
    }

    trace.add("Selected topic", "completed", "Loaded the selected public demo topic.", { topicId });
    trace.add("Classified intent", routedIntent.intent === "unknown" ? "warning" : "completed", "Ran deterministic phrase-based intent routing.", {
      intent: routedIntent.intent,
      confidence: routedIntent.confidence,
      matchedRules: routedIntent.matchedRules
    });

    const plan = generateAgentSql(userQuestion, topicId, routedIntent.intent);
    trace.add(
      "Selected metrics",
      plan.selectedMetrics.length > 0 ? "completed" : "warning",
      plan.selectedMetrics.length > 0
        ? "Selected metrics from the public metric catalog."
        : "No metrics were selected because the request is not currently executable.",
      { metrics: plan.selectedMetrics }
    );
    trace.add(
      "Selected tables",
      plan.selectedTables.length > 0 ? "completed" : "warning",
      plan.selectedTables.length > 0
        ? "Selected synthetic tables required by the SQL template."
        : "No synthetic tables were selected.",
      { tables: plan.selectedTables }
    );
    trace.add(
      "Generated SQL",
      plan.statements.length > 0 ? "completed" : "warning",
      plan.statements.length > 0
        ? "Generated deterministic read-only SQL."
        : "No SQL was generated for this request.",
      { statementIds: plan.statements.map((statement) => statement.id) }
    );

    const validationResults = validateAgentSql(plan.statements, {
      requiresDateFilter: plan.statements.length > 0,
      userQuestion
    });
    const validationFailed = hasValidationErrors(validationResults);

    trace.add(
      "Validated SQL",
      validationFailed ? "failed" : "completed",
      validationFailed
        ? "Validation found one or more blocking errors."
        : "Validation checks passed for generated SQL.",
      {
        errors: validationResults
          .filter((result) => result.severity === "error" && !result.passed)
          .map((result) => result.message)
      }
    );

    const executionResult = executeAgentSql(plan.statements, validationResults);
    const executionFailed = executionResult.some((result) => result.error);

    trace.add(
      "Executed SQL",
      validationFailed || plan.statements.length === 0 ? "warning" : executionFailed ? "failed" : "completed",
      validationFailed
        ? "Skipped execution because validation failed."
        : plan.statements.length === 0
          ? "Skipped execution because there was no SQL to run."
          : executionFailed
            ? "A SQL execution error occurred."
            : "Executed validated SQL against in-memory synthetic tables.",
      { rowCounts: executionResult.map((result) => result.rowCount) }
    );

    const chartSpec = buildChartSpec(routedIntent.intent, executionResult);
    trace.add(
      "Built chart spec",
      chartSpec ? "completed" : "warning",
      chartSpec ? "Mapped executed rows to a chart-ready deterministic spec." : "No chart spec was produced.",
      { chartType: chartSpec?.type ?? "none" }
    );

    const warnings = Array.from(new Set(plan.warnings));
    const guardrailDecision = decideGuardrail(false, validationFailed || executionFailed, warnings);
    const finalAnswer =
      routedIntent.intent === "unknown"
        ? generateUnknownAnswer()
        : generateGroundedAnswer(routedIntent.intent, executionResult, warnings, guardrailDecision);

    trace.add("Generated grounded answer", "completed", "Created the final answer from execution output and warnings.", {
      hasAnswer: Boolean(finalAnswer)
    });
    trace.add(
      "Applied warnings",
      warnings.length > 0 ? "warning" : "completed",
      warnings.length > 0 ? "Attached caveats and review warnings." : "No additional warnings were needed.",
      { warnings }
    );
    trace.add(
      "Guardrail decision",
      guardrailDecision === "allowed" ? "completed" : "warning",
      `Guardrail decision: ${guardrailDecision}.`,
      { decision: guardrailDecision }
    );

    const run: AgentRun = {
      runId,
      status: validationFailed || executionFailed ? "failed" : routedIntent.intent === "unknown" ? "completed" : "completed",
      topicId,
      userQuestion,
      intent: routedIntent.intent,
      selectedMetrics: plan.selectedMetrics,
      selectedTables: plan.selectedTables,
      generatedSql: plan.statements,
      validationResults,
      executionResult,
      chartSpec,
      traceSteps: trace.steps,
      warnings,
      guardrailDecision,
      finalAnswer,
      suggestedFollowUps: plan.suggestedFollowUps,
      createdAt
    };

    events.completed(run);
    return run;
  } catch (error) {
    if (!events.hasTerminalEvent()) {
      events.failed(error);
    }

    throw error;
  }
}
