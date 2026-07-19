import { deriveRunOutcome } from "../../agent/runOutcome";
import type { AgentRun } from "../../agent/types";
import { ChartPreview } from "./ChartPreview";
import { GuardrailPanel } from "./GuardrailPanel";
import { ResultTable } from "./ResultTable";
import { SqlViewer } from "./SqlViewer";
import { TraceTimeline } from "./TraceTimeline";
import { WarningPanel } from "./WarningPanel";

interface ExecutionResultPanelProps {
  run: AgentRun;
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function ExecutionResultPanel({ run }: ExecutionResultPanelProps) {
  const outcome = deriveRunOutcome(run);

  return (
    <section className="execution-result-panel" aria-label="Agent execution result">
      <div className="execution-result-panel__header">
        <div>
          <span className="section-header__eyebrow">Deterministic Run</span>
          <h2>Final Answer</h2>
        </div>
        <div className="execution-meta">
          <span>{titleCase(run.intent)}</span>
          <span>{titleCase(run.status)}</span>
        </div>
      </div>

      <p className="final-answer">{run.finalAnswer}</p>
      <GuardrailPanel decision={run.guardrailDecision} />
      <WarningPanel warnings={run.warnings} />

      <div className="execution-pill-row">
        {run.selectedMetrics.map((metric) => (
          <span key={metric}>{metric}</span>
        ))}
        {run.selectedTables.map((table) => (
          <span key={table}>{table}</span>
        ))}
      </div>

      <ChartPreview spec={run.chartSpec} />
      <SqlViewer
        noSqlOutcome={outcome.noSqlOutcome}
        statements={run.generatedSql}
        validationResults={run.validationResults}
      />

      {run.executionResult.map((result, index) => (
        <ResultTable
          key={run.generatedSql[index]?.id ?? `result-${index}`}
          result={result}
          title={run.generatedSql[index]?.title ?? `Result ${index + 1}`}
        />
      ))}

      <TraceTimeline steps={run.traceSteps} />

      {run.suggestedFollowUps.length > 0 ? (
        <section className="execution-section">
          <h3>Suggested Follow-ups</h3>
          <ul className="follow-up-list">
            {run.suggestedFollowUps.map((followUp) => (
              <li key={followUp}>{followUp}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
