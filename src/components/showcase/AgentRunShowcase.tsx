import { useMemo } from "react";
import { deriveRunOutcome } from "../../agent/runOutcome";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShowcaseHeader } from "./ShowcaseHeader";
import { ShowcaseMetricCard } from "./ShowcaseMetricCard";
import { ShowcaseResultPreview } from "./ShowcaseResultPreview";
import { ShowcaseSqlCard } from "./ShowcaseSqlCard";
import { ShowcaseTraceRail } from "./ShowcaseTraceRail";
import { useShowcaseRun } from "./useShowcaseRun";

const agentQuestion = "Which product category had the highest refund rate last month?";

function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

function latestEventLabel(event: ReturnType<typeof useShowcaseRun>["events"][number] | undefined) {
  if (!event) {
    return undefined;
  }

  return event.type === "step.completed" ? event.step.label : event.type;
}

export function AgentRunShowcase() {
  const stream = useShowcaseRun(agentQuestion, "retail-growth-demo");
  const { error, events, isRunning, run, status } = stream;
  const liveEvent = latestEventLabel(events.at(-1));
  const traceSteps = useMemo(
    () => events.filter((event) => event.type === "step.completed").map((event) => event.step),
    [events]
  );
  const firstResult = run?.executionResult[0];
  const outcome = run ? deriveRunOutcome(run) : undefined;
  const answerLabel = !run
    ? undefined
    : run.status === "failed"
      ? "Failed Agent Outcome"
      : run.status === "blocked"
        ? "Blocked Outcome"
        : outcome?.needsOutcomeReview
          ? "Answer Needs Review"
          : "Grounded Answer";
  const terminalSummary = !run
    ? undefined
    : run.status === "failed"
      ? `Server returned a failed agent outcome with ${events.length} NDJSON events.`
      : run.status === "blocked"
        ? `Server returned a blocked agent outcome with ${events.length} NDJSON events.`
        : outcome?.needsOutcomeReview
          ? `Server returned an agent outcome requiring review with ${events.length} NDJSON events.`
          : `Server run completed with ${events.length} NDJSON events.`;
  const validationSummary = !run
    ? undefined
    : run.validationResults.length === 0
      ? "No checks"
      : run.validationResults.every((result) => result.passed)
        ? "Passed"
        : "Review";

  return (
    <>
      <ShowcaseHeader
        label="LIVE SERVER RUN"
        subtitle="Question to validated SQL, serverless execution, and trace over NDJSON."
        title="Agent Run"
      />
      {!run ? (
        <section aria-live="polite" className="showcase-frame showcase-run-state" role="status">
          <h2>{status === "failed" || status === "cancelled" ? "Run needs attention" : "Running on the server"}</h2>
          <p>
            {error ??
              `Received ${events.length} server events${liveEvent ? `; latest: ${liveEvent}` : ""} for the prepared question.`}
          </p>
          {isRunning ? <span className="showcase-run-state__event">Live event stream active</span> : null}
          {!isRunning ? (
            <Button onClick={() => void stream.retry()} variant="primary">
              Retry server run
            </Button>
          ) : (
            <Button onClick={stream.cancel} variant="secondary">
              Stop receiving
            </Button>
          )}
        </section>
      ) : (
        <>
          <section className="showcase-frame showcase-agent-grid" aria-label="Agent Run Showcase">
            <div className="showcase-column">
              <section className="showcase-card">
                <div className="showcase-card__heading">
                  <h2>Question</h2>
                  <Badge tone="blue">Retail Growth Demo</Badge>
                </div>
                <p className="showcase-question">{run.userQuestion}</p>
                <dl className="showcase-run-id">
                  <dt>Run ID</dt>
                  <dd>
                    <code>{run.runId}</code>
                  </dd>
                </dl>
                <div className="showcase-chip-row">
                  <span className="showcase-chip showcase-chip--violet">{titleCase(run.intent)}</span>
                  {run.selectedMetrics.map((metric) => (
                    <span className="showcase-chip showcase-chip--blue" key={metric}>
                      {metric}
                    </span>
                  ))}
                  {run.selectedTables.map((table) => (
                    <span className="showcase-chip showcase-chip--green" key={table}>
                      {table}
                    </span>
                  ))}
                </div>
              </section>

              <div className="showcase-metric-grid">
                <ShowcaseMetricCard
                  label="Guardrail"
                  tone={outcome?.guardrailTone}
                  value={titleCase(run.guardrailDecision)}
                />
                <ShowcaseMetricCard label="Trace" tone="violet" value={`${traceSteps.length} steps`} />
              </div>
            </div>

            <div className="showcase-column showcase-column--wide">
              <section className="showcase-card showcase-answer-card">
                <span>{answerLabel}</span>
                <p>{run.finalAnswer}</p>
              </section>
              <ShowcaseResultPreview chartSpec={run.chartSpec} result={firstResult} />
            </div>

            <div className="showcase-column">
              <section className="showcase-card">
                <div className="showcase-card__heading">
                  <h2>Validation</h2>
                  <span>{validationSummary}</span>
                </div>
                <div className="showcase-validation-list">
                  {run.validationResults.slice(0, 4).map((result) => (
                    <span
                      className={`showcase-chip showcase-chip--${result.passed ? "green" : "red"}`}
                      key={result.id}
                    >
                      {result.message}
                    </span>
                  ))}
                </div>
              </section>
              <ShowcaseSqlCard statements={run.generatedSql} validationResults={run.validationResults} />
              <ShowcaseTraceRail steps={traceSteps} />
            </div>
          </section>
          <div aria-live="polite" className="showcase-run-toolbar" role="status">
            <span>{terminalSummary}</span>
            <Button onClick={() => void stream.retry()} variant="secondary">
              Run again
            </Button>
          </div>
        </>
      )}
      <footer className="showcase-footer-strip">
        <span>Synthetic data only</span>
        <span>No LLM API</span>
        <span>Serverless API execution</span>
        <span>Real server events</span>
      </footer>
    </>
  );
}
