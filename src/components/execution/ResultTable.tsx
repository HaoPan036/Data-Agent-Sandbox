import type { ExecutionResult, QueryValue } from "../../agent/types";

interface ResultTableProps {
  result: ExecutionResult;
  title: string;
}

function formatValue(value: QueryValue) {
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? new Intl.NumberFormat("en-US").format(value)
      : new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return value ?? "";
}

export function ResultTable({ result, title }: ResultTableProps) {
  const rows = result.rows.slice(0, 12);

  return (
    <section className="execution-section">
      <div className="result-table-header">
        <h3>{title}</h3>
        <span>{result.rowCount} rows</span>
      </div>
      {result.error ? <p className="execution-error">{result.error}</p> : null}
      {!result.error && result.rowCount === 0 ? <p className="muted">No rows returned.</p> : null}
      {!result.error && rows.length > 0 ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {result.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`}>
                  {result.columns.map((column) => (
                    <td key={column}>{formatValue(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
