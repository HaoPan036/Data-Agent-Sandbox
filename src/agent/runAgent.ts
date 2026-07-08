import { generateBlockedAnswer, generateGroundedAnswer, generateUnknownAnswer } from "./answerGenerator";
import { buildChartSpec } from "./chartSpec";
import { classifyIntent } from "./intentRouter";
import { executeAgentSql } from "./sqlExecutor";
import { generateAgentSql } from "./sqlGenerator";
import { hasValidationErrors, validateAgentSql } from "./sqlValidator";
import { createTraceStep } from "./trace";
import type { AgentRun, AgentRunOptions, AgentTraceStep, GuardrailDecision } from "./types";

function createRunId() {
  return `run-${Math.random().toString(36).slice(2, 10)}`;
}

function traceBuilder() {
  const steps: AgentTraceStep[] = [];

  return {
    add(label: string, status: AgentTraceStep["status"], message: string, details?: AgentTraceStep["details"]) {
      steps.push(createTraceStep(steps.length + 1, label, status, message, details));
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
  const createdAt = options.createdAt ?? new Date().toISOString();
  const runId = options.runId ?? createRunId();
  const trace = traceBuilder();
  const userQuestion = question.trim();

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

    return {
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

  return {
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
}
