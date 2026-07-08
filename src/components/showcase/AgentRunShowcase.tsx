import { useMemo } from "react";
import { runAgent } from "../../agent/runAgent";
import { Badge } from "../ui/Badge";
import { ShowcaseHeader } from "./ShowcaseHeader";
import { ShowcaseMetricCard } from "./ShowcaseMetricCard";
import { ShowcaseResultPreview } from "./ShowcaseResultPreview";
import { ShowcaseSqlCard } from "./ShowcaseSqlCard";
import { ShowcaseTraceRail } from "./ShowcaseTraceRail";

const agentQuestion = "Which product category had the highest refund rate last month?";

function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

export function AgentRunShowcase() {
  const run = useMemo(
    () => runAgent(agentQuestion, "retail-growth-demo", { runId: "showcase-agent-run" }),
    []
  );
  const firstResult = run.executionResult[0];

  if (run.status === "failed") {
    return (
      <>
        <ShowcaseHeader
          label="LIVE DETERMINISTIC RUN"
          subtitle="The run failed during deterministic execution."
          title="Agent Run"
        />
        <section className="showcase-frame showcase-frame--error">
          <h2>Run failed</h2>
          <p>{run.finalAnswer}</p>
        </section>
      </>
    );
  }

  return (
    <>
      <ShowcaseHeader
        label="LIVE DETERMINISTIC RUN"
        subtitle="Question to validated SQL, local execution, and trace."
        title="Agent Run"
      />
      <section className="showcase-frame showcase-agent-grid" aria-label="Agent Run Showcase">
        <div className="showcase-column">
          <section className="showcase-card">
            <div className="showcase-card__heading">
              <h2>Question</h2>
              <Badge tone="blue">Retail Growth Demo</Badge>
            </div>
            <p className="showcase-question">{run.userQuestion}</p>
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
            <ShowcaseMetricCard label="Guardrail" tone="green" value={titleCase(run.guardrailDecision)} />
            <ShowcaseMetricCard label="Trace" tone="violet" value={`${run.traceSteps.length} steps`} />
          </div>
        </div>

        <div className="showcase-column showcase-column--wide">
          <section className="showcase-card showcase-answer-card">
            <span>Grounded Answer</span>
            <p>{run.finalAnswer}</p>
          </section>
          <ShowcaseResultPreview chartSpec={run.chartSpec} result={firstResult} />
        </div>

        <div className="showcase-column">
          <section className="showcase-card">
            <div className="showcase-card__heading">
              <h2>Validation</h2>
              <span>{run.validationResults.every((result) => result.passed) ? "Passed" : "Review"}</span>
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
          <ShowcaseTraceRail steps={run.traceSteps} />
        </div>
      </section>
      <footer className="showcase-footer-strip">
        <span>Synthetic data only</span>
        <span>No LLM API</span>
        <span>No backend</span>
        <span>No fake output</span>
      </footer>
    </>
  );
}
