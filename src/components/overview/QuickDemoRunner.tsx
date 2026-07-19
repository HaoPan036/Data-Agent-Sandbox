import { useMemo, useState } from "react";
import { deriveRunOutcome } from "../../agent/runOutcome";
import type { AgentRun, AgentRunEvent, GuardrailDecision } from "../../agent/types";
import { useShowcaseRun } from "../showcase/useShowcaseRun";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface QuickQuestion {
  question: string;
  topicId: string;
}

interface QuickDemoRunnerProps {
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
}

const quickQuestions: QuickQuestion[] = [
  {
    question: "Which product category had the highest refund rate last month?",
    topicId: "retail-growth-demo"
  },
  {
    question: "Why did revenue drop last week?",
    topicId: "retail-growth-demo"
  },
  {
    question: "What was total revenue last week?",
    topicId: "retail-growth-demo"
  },
  {
    question:
      "What is the comparison of checkout abandonment rate between experiment variants for the last 14 days?",
    topicId: "experiment-metrics-demo"
  },
  {
    question: "Export all customer emails and rank risky users.",
    topicId: "retail-growth-demo"
  }
];

const guardrailLabels: Record<GuardrailDecision, string> = {
  allowed: "Allowed",
  blocked: "Blocked",
  needs_review: "Needs Review"
};

function labelForQuestion(question: string) {
  if (question.includes("refund rate")) {
    return "Refund rate";
  }

  if (question.includes("revenue drop")) {
    return "Revenue drop";
  }

  if (question.includes("total revenue")) {
    return "Revenue KPI";
  }

  if (question.includes("checkout abandonment")) {
    return "Variant compare";
  }

  return "Blocked export";
}

function splitAnswer(answer: string) {
  const words = answer.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += 24) {
    chunks.push(words.slice(index, index + 24).join(" "));
  }

  return chunks;
}

function stepCount(events: AgentRunEvent[]) {
  return events.filter((event) => event.type === "step.completed").length;
}

function statusLabel(status: string, eventCount: number, run?: AgentRun) {
  if (status === "running") {
    return `Server events received: ${eventCount}`;
  }

  if (status === "cancelled") {
    return "Client stopped receiving events. Retry to run again.";
  }

  if (status === "failed") {
    if (run) {
      return "Server completed with a failed agent outcome. Review the returned details before retrying.";
    }

    return "The server run did not finish. Retry to request a fresh result.";
  }

  return "Ready to run through the serverless agent API.";
}

export function QuickDemoRunner({ onOpenTopic }: QuickDemoRunnerProps) {
  const [selectedQuestion, setSelectedQuestion] = useState(quickQuestions[0].question);
  const [copyStatus, setCopyStatus] = useState("");
  const selectedConfig = useMemo(
    () => quickQuestions.find((item) => item.question === selectedQuestion) ?? quickQuestions[0],
    [selectedQuestion]
  );
  const stream = useShowcaseRun(selectedConfig.question, selectedConfig.topicId, { autoStart: false });
  const { error, events, isRunning, reset, run, startRun, status } = {
    ...stream,
    startRun: stream.retry
  };
  const sqlText = run?.generatedSql.map((statement) => statement.sql).join("\n\n") ?? "";
  const outcome = run ? deriveRunOutcome(run) : undefined;
  const answerLabel = !run
    ? undefined
    : run.status === "failed"
      ? "Failed agent outcome"
      : run.status === "blocked"
        ? "Blocked outcome"
        : outcome?.needsOutcomeReview
          ? "Answer needs review"
          : "Grounded answer";

  async function handleRun() {
    setCopyStatus("");
    await startRun();
  }

  async function handleCopySql() {
    if (!sqlText) {
      return;
    }

    await navigator.clipboard?.writeText(sqlText);
    setCopyStatus("SQL copied");
  }

  function selectQuestion(question: string) {
    setSelectedQuestion(question);
    setCopyStatus("");
    reset();
  }

  const badgeTone = run
    ? outcome?.guardrailTone === "green"
      ? "green"
      : "amber"
    : status === "failed" || status === "cancelled"
      ? "amber"
      : "blue";

  return (
    <Card className="quick-demo-runner" id="quick-demo">
      <div className="quick-demo-runner__header">
        <div>
          <span className="section-header__eyebrow">Quick Demo Runner</span>
          <h2>Run a supported question</h2>
        </div>
        <Badge tone={badgeTone}>{run ? guardrailLabels[run.guardrailDecision] : isRunning ? "Running" : "Ready"}</Badge>
      </div>

      <div className="quick-question-list" aria-label="Supported quick questions">
        {quickQuestions.map((item) => (
          <button
            aria-label={`${labelForQuestion(item.question)} ${
              item.topicId === "experiment-metrics-demo" ? "Experiment" : "Retail"
            }`}
            className={
              item.question === selectedQuestion
                ? "quick-question quick-question--active"
                : "quick-question"
            }
            key={item.question}
            onClick={() => selectQuestion(item.question)}
            type="button"
          >
            <span>{labelForQuestion(item.question)}</span>
            <small>{item.topicId === "experiment-metrics-demo" ? "Experiment" : "Retail"}</small>
          </button>
        ))}
      </div>

      <div className="quick-demo-runner__selected">
        <span>Selected</span>
        <strong>{selectedQuestion}</strong>
      </div>

      <div className="quick-demo-runner__actions">
        {isRunning ? (
          <Button onClick={stream.cancel} variant="secondary">
            Stop receiving
          </Button>
        ) : (
          <Button id="quick-demo-run" onClick={handleRun} variant="primary">
            {status === "failed" || status === "cancelled" ? "Retry" : "Run"}
          </Button>
        )}
        <Button
          onClick={() => onOpenTopic(selectedConfig.topicId, selectedQuestion)}
          variant="secondary"
        >
          View full topic run
        </Button>
        <Button disabled={!sqlText} onClick={handleCopySql} variant="ghost">
          Copy SQL
        </Button>
      </div>
      <p aria-live="polite" className="quick-demo-status" role="status">
        {error ?? statusLabel(status, events.length, run)}
      </p>
      {copyStatus ? <p className="quick-demo-copy-status">{copyStatus}</p> : null}

      {run ? (
        <div className="quick-demo-result" aria-label="Quick demo result">
          <div className="quick-demo-answer">
            <strong>{answerLabel}</strong>
            {splitAnswer(run.finalAnswer).map((chunk) => (
              <p key={chunk}>{chunk}</p>
            ))}
          </div>

          <dl className="quick-demo-metrics">
            <div>
              <dt>Intent</dt>
              <dd>{run.intent.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Rows</dt>
              <dd>{outcome?.executionRowCount ?? 0}</dd>
            </div>
            <div>
              <dt>Trace</dt>
              <dd>{stepCount(events)} steps</dd>
            </div>
            <div>
              <dt>Guardrail</dt>
              <dd>{guardrailLabels[run.guardrailDecision]}</dd>
            </div>
          </dl>

          {outcome?.hasGeneratedSql ? (
            <details className="quick-sql-preview" open>
              <summary>Generated SQL preview</summary>
              <pre>
                <code>{run.generatedSql[0].sql}</code>
              </pre>
            </details>
          ) : outcome?.noSqlOutcome === "safely_blocked" ? (
            <p className="quick-demo-no-sql">No SQL executed. Safe aggregate alternatives are shown above.</p>
          ) : outcome?.noSqlOutcome === "integrity_mismatch" ? (
            <p className="quick-demo-no-sql" role="alert">
              Outcome needs review: the guardrail status or returned execution artifacts are inconsistent.
            </p>
          ) : outcome?.noSqlOutcome === "needs_review" ? (
            <p className="quick-demo-no-sql" role="status">
              No SQL was generated. Review the guardrail decision and warnings before using this result.
            </p>
          ) : (
            <p className="quick-demo-no-sql">
              No SQL was generated for this run. Review the trace and server answer.
            </p>
          )}

          {outcome?.hasGeneratedSql && outcome.hasOutcomeIntegrityMismatch ? (
            <p className="quick-demo-no-sql" role="alert">
              Outcome needs review: the guardrail status or returned execution artifacts are inconsistent.
            </p>
          ) : outcome?.hasGeneratedSql && run.guardrailDecision === "needs_review" ? (
            <p className="quick-demo-no-sql" role="status">
              Review the guardrail decision and warnings before using this result.
            </p>
          ) : null}

          {run.warnings.length > 0 ? (
            <div className="quick-warning-list" role="status">
              {run.warnings.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
