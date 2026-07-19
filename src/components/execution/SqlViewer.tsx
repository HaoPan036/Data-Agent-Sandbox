import type { NoSqlOutcome } from "../../agent/runOutcome";
import type { AgentSqlStatement, AgentValidationResult } from "../../agent/types";

interface SqlViewerProps {
  noSqlOutcome: NoSqlOutcome;
  statements: AgentSqlStatement[];
  validationResults: AgentValidationResult[];
}

function validationLabel(result: AgentValidationResult) {
  if (result.passed) {
    return result.severity === "warning" ? "Warn" : "Pass";
  }

  return result.severity === "error" ? "Error" : "Warn";
}

function noSqlMessage(outcome: NoSqlOutcome) {
  if (outcome === "safely_blocked") {
    return "No SQL was generated or executed for this request.";
  }

  if (outcome === "integrity_mismatch") {
    return "Execution integrity needs review: SQL was not generated, but the guardrail status, execution results, or chart data are inconsistent.";
  }

  if (outcome === "needs_review") {
    return "No SQL was generated. Review the guardrail decision and warnings before using this result.";
  }

  return "No SQL was generated for this run.";
}

export function SqlViewer({ noSqlOutcome, statements, validationResults }: SqlViewerProps) {
  return (
    <section className="execution-section">
      <h3>Generated SQL</h3>
      {statements.length === 0 ? (
        <p className="muted">{noSqlMessage(noSqlOutcome)}</p>
      ) : (
        <div className="sql-statement-list">
          {statements.map((statement) => (
            <article key={statement.id}>
              <div className="sql-statement-list__header">
                <strong>{statement.title}</strong>
                <span>{statement.id}</span>
              </div>
              <pre>
                <code>{statement.sql}</code>
              </pre>
            </article>
          ))}
        </div>
      )}

      <h3>Validation Results</h3>
      <ul className="validation-list">
        {validationResults.map((result) => (
          <li className={`validation-list__item validation-list__item--${result.severity}`} key={result.id}>
            <span>{validationLabel(result)}</span>
            <p>{result.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
