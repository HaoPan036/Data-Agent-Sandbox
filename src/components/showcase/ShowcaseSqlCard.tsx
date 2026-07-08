import type { AgentSqlStatement, AgentValidationResult } from "../../agent/types";

interface ShowcaseSqlCardProps {
  maxLines?: number;
  statements: AgentSqlStatement[];
  validationResults: AgentValidationResult[];
}

function validationTone(result: AgentValidationResult) {
  if (!result.passed && result.severity === "error") {
    return "red";
  }

  if (result.severity === "warning") {
    return "amber";
  }

  return "green";
}

export function ShowcaseSqlCard({ maxLines = 12, statements, validationResults }: ShowcaseSqlCardProps) {
  const sql = statements.map((statement) => statement.sql).join("\n\n");
  const preview = sql.split("\n").slice(0, maxLines).join("\n");
  const hiddenLineCount = Math.max(0, sql.split("\n").length - maxLines);

  return (
    <section className="showcase-card showcase-sql-card">
      <div className="showcase-card__heading">
        <h2>SQL Preview</h2>
        <span>{statements.length} statements</span>
      </div>
      {statements.length === 0 ? (
        <p className="showcase-muted">No SQL generated.</p>
      ) : (
        <pre>
          <code>
            {preview}
            {hiddenLineCount > 0 ? `\n... ${hiddenLineCount} more lines` : ""}
          </code>
        </pre>
      )}
      <div className="showcase-validation-strip">
        {validationResults.slice(0, 4).map((result) => (
          <span className={`showcase-chip showcase-chip--${validationTone(result)}`} key={result.id}>
            {result.passed ? "Pass" : "Fail"}
          </span>
        ))}
      </div>
    </section>
  );
}
