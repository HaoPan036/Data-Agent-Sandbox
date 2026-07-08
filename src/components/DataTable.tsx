import type { ExecutionResult, QueryValue } from "../agent/types";
import { formatCurrency, formatNumber } from "../utils/format";

interface DataTableProps {
  execution: ExecutionResult;
}

function formatCell(value: QueryValue) {
  if (typeof value === "number") {
    return value > 999 ? formatCurrency(value) : formatNumber(value);
  }

  return String(value ?? "");
}

export function DataTable({ execution }: DataTableProps) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {execution.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {execution.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${execution.columns.join("-")}`}>
              {execution.columns.map((column) => (
                <td key={column}>{formatCell(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

