import { useMemo } from "react";
import { deriveRunOutcome } from "../../agent/runOutcome";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShowcaseHeader } from "./ShowcaseHeader";
import { ShowcaseMetricCard } from "./ShowcaseMetricCard";
import { ShowcaseTraceRail } from "./ShowcaseTraceRail";
import { useShowcaseRun } from "./useShowcaseRun";

const guardrailQuestion = "Export all customer emails and rank risky users.";

function safeAlternative(answer: string) {
  const match = answer.match(/A safe alternative.+/);

  return match?.[0] ?? answer;
}

function latestEventLabel(event: ReturnType<typeof useShowcaseRun>["events"][number] | undefined) {
  if (!event) {
    return undefined;
  }

  return event.type === "step.completed" ? event.step.label : event.type;
}

export function GuardrailShowcase() {
  const stream = useShowcaseRun(guardrailQuestion, "retail-growth-demo");
  const { error, events, isRunning, run, status } = stream;
  const liveEvent = latestEventLabel(events.at(-1));
  const traceSteps = useMemo(
    () => events.filter((event) => event.type === "step.completed").map((event) => event.step),
    [events]
  );
  const outcome = run ? deriveRunOutcome(run) : undefined;
  const sqlCount = outcome?.sqlStatementCount ?? 0;
  const resultCount = outcome?.executionResultSetCount ?? 0;
  const chartRowCount = outcome?.chartDataRowCount ?? 0;
  const noExecutionArtifacts = outcome ? !outcome.hasExecutionArtifacts : true;
  const safelyBlocked = outcome?.isSafelyBlocked ?? false;
  const needsReview = Boolean(run && !safelyBlocked);
  const headerTitle = safelyBlocked
    ? "Sensitive Request Blocked"
    : needsReview
      ? "Guardrail Outcome Needs Review"
      : "Sensitive Request Guardrail";
  const headerSubtitle = safelyBlocked
    ? "A serverless agent run stops before SQL execution and suggests an aggregate alternative."
    : needsReview
      ? "The server response did not satisfy every condition required for a safe block."
      : "A serverless agent run is checking the prepared sensitive request before SQL execution.";

  return (
    <>
      <ShowcaseHeader
        label={needsReview ? "QUERY GUARD REVIEW" : "QUERY GUARD"}
        subtitle={headerSubtitle}
        title={headerTitle}
      />
      {!run ? (
        <section aria-live="polite" className="showcase-frame showcase-run-state" role="status">
          <h2>{status === "failed" || status === "cancelled" ? "Guardrail run needs attention" : "Checking the guardrail on the server"}</h2>
          <p>
            {error ??
              `Received ${events.length} server events${liveEvent ? `; latest: ${liveEvent}` : ""} for the prepared sensitive request.`}
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
          <section className="showcase-frame showcase-guardrail-grid" aria-label="Guardrail Showcase">
            <section className="showcase-card showcase-risk-card">
              <div className="showcase-card__heading">
                <h2>Risk Request</h2>
                <Badge tone="amber">Governance</Badge>
              </div>
              <p className="showcase-question">{run.userQuestion}</p>
              <div className="showcase-chip-row">
                <span className="showcase-chip showcase-chip--red">User-level data</span>
                <span className="showcase-chip showcase-chip--red">Sensitive export</span>
                <span className="showcase-chip showcase-chip--amber">Profiling risk</span>
              </div>
            </section>

            <section className="showcase-card showcase-blocked-card">
              <span>{safelyBlocked ? "Blocked Decision" : "Outcome Review"}</span>
              <strong>{safelyBlocked ? "Blocked by Query Guard" : "Guardrail result needs review"}</strong>
              <p>
                {safelyBlocked
                  ? run.warnings[0] ?? "This request asks for user-level sensitive data."
                  : `The server reported status ${run.status} with decision ${run.guardrailDecision}; this response is not accepted as a safe block.`}
              </p>
              <div className="showcase-safe-alternative">
                <span>{safelyBlocked ? "Safe alternative" : "Server answer for review"}</span>
                <p>{safelyBlocked ? safeAlternative(run.finalAnswer) : run.finalAnswer}</p>
              </div>
              <div className="showcase-metric-grid">
                <ShowcaseMetricCard
                  label="Decision"
                  tone={safelyBlocked ? "red" : "amber"}
                  value={run.guardrailDecision}
                />
                <ShowcaseMetricCard
                  label="SQL / results"
                  tone={safelyBlocked ? "green" : "red"}
                  value={safelyBlocked ? "None" : `${sqlCount} / ${resultCount}`}
                />
              </div>
            </section>

            <div className="showcase-column">
              <ShowcaseTraceRail steps={traceSteps} title="Guardrail Trace" />
              <section className="showcase-card showcase-no-sql-card">
                <h2>{safelyBlocked ? "No SQL executed" : "Guardrail review required"}</h2>
                <p>
                  {safelyBlocked
                    ? "The server guardrail stopped generation and execution."
                    : noExecutionArtifacts
                      ? "No execution activity was returned, but the status and decision do not confirm a safe block."
                      : `Unexpected execution activity: ${sqlCount} SQL statement${sqlCount === 1 ? "" : "s"} and ${resultCount} result set${resultCount === 1 ? "" : "s"}.${chartRowCount > 0 ? ` Chart data also contains ${chartRowCount} row${chartRowCount === 1 ? "" : "s"}.` : ""}`}
                </p>
              </section>
            </div>
          </section>
          <div aria-live="polite" className="showcase-run-toolbar" role="status">
            <span>Server guardrail completed with {events.length} NDJSON events.</span>
            <Button onClick={() => void stream.retry()} variant="secondary">
              Run again
            </Button>
          </div>
        </>
      )}
      <footer className="showcase-footer-strip showcase-footer-strip--danger">
        {safelyBlocked ? (
          <>
            <span>No SQL executed</span>
            <span>Real server guardrail trace</span>
            <span>Aggregate alternative only</span>
          </>
        ) : needsReview && run ? (
          <>
            <span>Guardrail review required</span>
            <span>Decision: {run.guardrailDecision}</span>
            <span>{sqlCount} SQL statements</span>
            <span>{resultCount} result sets</span>
          </>
        ) : (
          <>
            <span>{status === "failed" || status === "cancelled" ? "Guardrail check unavailable" : "Guardrail check pending"}</span>
            <span>No trusted terminal result</span>
            <span>Real server event stream</span>
          </>
        )}
      </footer>
    </>
  );
}
