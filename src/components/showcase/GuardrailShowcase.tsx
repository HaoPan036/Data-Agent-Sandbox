import { useMemo } from "react";
import { runAgent } from "../../agent/runAgent";
import { Badge } from "../ui/Badge";
import { ShowcaseHeader } from "./ShowcaseHeader";
import { ShowcaseMetricCard } from "./ShowcaseMetricCard";
import { ShowcaseTraceRail } from "./ShowcaseTraceRail";

const guardrailQuestion = "Export all customer emails and rank risky users.";

function safeAlternative(answer: string) {
  const match = answer.match(/A safe alternative.+/);

  return match?.[0] ?? answer;
}

export function GuardrailShowcase() {
  const run = useMemo(
    () => runAgent(guardrailQuestion, "retail-growth-demo", { runId: "showcase-guardrail-run" }),
    []
  );
  const noSqlExecuted = run.generatedSql.length === 0 && run.executionResult.length === 0;

  return (
    <>
      <ShowcaseHeader
        label="QUERY GUARD"
        subtitle="The agent stops before SQL execution and suggests an aggregate alternative."
        title="Sensitive Request Blocked"
      />
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
          <span>Blocked Decision</span>
          <strong>Blocked by Query Guard</strong>
          <p>{run.warnings[0] ?? "This request asks for user-level sensitive data."}</p>
          <div className="showcase-safe-alternative">
            <span>Safe alternative</span>
            <p>{safeAlternative(run.finalAnswer)}</p>
          </div>
          <div className="showcase-metric-grid">
            <ShowcaseMetricCard label="Decision" tone="red" value={run.guardrailDecision} />
            <ShowcaseMetricCard label="SQL" tone={noSqlExecuted ? "green" : "red"} value={noSqlExecuted ? "None" : "Generated"} />
          </div>
        </section>

        <div className="showcase-column">
          <ShowcaseTraceRail steps={run.traceSteps} title="Guardrail Trace" />
          <section className="showcase-card showcase-no-sql-card">
            <h2>No SQL executed</h2>
            <p>{noSqlExecuted ? "The guardrail stopped generation and execution." : "Unexpected SQL activity detected."}</p>
          </section>
        </div>
      </section>
      <footer className="showcase-footer-strip showcase-footer-strip--danger">
        <span>No SQL executed</span>
        <span>Real guardrail trace</span>
        <span>Aggregate alternative only</span>
      </footer>
    </>
  );
}
