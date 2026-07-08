import type { AgentSqlStatement, AgentValidationResult } from "../../agent/types";
import type { EvaluationCaseResult } from "../../evaluation/evaluationTypes";

interface EvaluationCaseDrawerProps {
  caseResult?: EvaluationCaseResult;
  onAddToQueue: (caseResult: EvaluationCaseResult) => void;
}

function sqlPreview(statements: AgentSqlStatement[]) {
  if (statements.length === 0) {
    return "No SQL generated.";
  }

  return statements.map((statement) => statement.sql).join("\n\n");
}

function validationText(results: AgentValidationResult[]) {
  if (results.length === 0) {
    return "No validation results.";
  }

  return results.map((result) => `${result.passed ? "Pass" : "Fail"}: ${result.message}`).join("\n");
}

export function EvaluationCaseDrawer({ caseResult, onAddToQueue }: EvaluationCaseDrawerProps) {
  if (!caseResult) {
    return (
      <section className="evaluation-panel case-drawer">
        <h2>Case Details</h2>
        <p className="muted">Run evaluation and select a case to inspect its trace.</p>
      </section>
    );
  }

  return (
    <section className="evaluation-panel case-drawer" aria-label="Evaluation case details">
      <div className="case-drawer__header">
        <div>
          <h2>{caseResult.caseId}</h2>
          <p>{caseResult.userQuestion}</p>
        </div>
        <button className="button button--primary" onClick={() => onAddToQueue(caseResult)} type="button">
          Add to review queue
        </button>
      </div>

      <dl className="case-detail-grid">
        <div>
          <dt>Expected intent</dt>
          <dd>{caseResult.expected.intent}</dd>
        </div>
        <div>
          <dt>Actual intent</dt>
          <dd>{caseResult.actual.intent}</dd>
        </div>
        <div>
          <dt>Guardrail</dt>
          <dd>{caseResult.actual.guardrailDecision}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{caseResult.score}</dd>
        </div>
      </dl>

      <div className="case-detail-stack">
        <article>
          <h3>Final Answer</h3>
          <p>{caseResult.agentRun?.finalAnswer ?? caseResult.error ?? "No answer."}</p>
        </article>
        <article>
          <h3>Failure Reasons</h3>
          <ul>
            {(caseResult.failureReasons.length > 0 ? caseResult.failureReasons : ["None"]).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>Generated SQL</h3>
          <pre>
            <code>{sqlPreview(caseResult.agentRun?.generatedSql ?? [])}</code>
          </pre>
        </article>
        <article>
          <h3>Validation Results</h3>
          <pre>
            <code>{validationText(caseResult.agentRun?.validationResults ?? [])}</code>
          </pre>
        </article>
        <article>
          <h3>Warnings</h3>
          <p>{caseResult.agentRun?.warnings.join(" ") || "None"}</p>
        </article>
        <article>
          <h3>Trace</h3>
          <ol className="case-trace-list">
            {(caseResult.agentRun?.traceSteps ?? []).map((step) => (
              <li key={step.id}>
                <span>{step.id}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.message}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  );
}
