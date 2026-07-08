import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AgentChartSpec, ExecutionResult, QueryRow, QueryValue } from "../../agent/types";

interface ShowcaseResultPreviewProps {
  chartSpec?: AgentChartSpec;
  result?: ExecutionResult;
}

const colors = ["#2563eb", "#7c3aed", "#16a34a", "#d97706"];

function numberValue(row: QueryRow | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function formatValue(value: QueryValue | unknown) {
  if (typeof value === "number") {
    if (Math.abs(value) < 1) {
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, style: "percent" }).format(value);
    }

    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  }

  return String(value ?? "");
}

function pivotSeries(spec: AgentChartSpec) {
  if (!spec.seriesKey) {
    return {
      data: spec.data,
      yKeys: spec.yKeys
    };
  }

  const grouped = new Map<string, QueryRow>();
  const series = Array.from(new Set(spec.data.map((row) => String(row[spec.seriesKey ?? ""] ?? ""))));
  const yKey = spec.yKeys[0];

  for (const row of spec.data) {
    const xValue = String(row[spec.xKey] ?? "");
    const seriesName = String(row[spec.seriesKey] ?? "");
    const existing = grouped.get(xValue) ?? { [spec.xKey]: xValue };
    existing[seriesName] = numberValue(row, yKey);
    grouped.set(xValue, existing);
  }

  return {
    data: Array.from(grouped.values()),
    yKeys: series
  };
}

function Chart({ spec }: { spec: AgentChartSpec }) {
  if (spec.type === "kpi" || spec.type === "status") {
    return (
      <div className="showcase-kpi-chart">
        {spec.yKeys.map((key) => (
          <div key={key}>
            <span>{key.replaceAll("_", " ")}</span>
            <strong>{formatValue(spec.data[0]?.[key])}</strong>
          </div>
        ))}
      </div>
    );
  }

  const chart = pivotSeries(spec);

  return (
    <div className="showcase-chart" aria-label={`${spec.title} chart`}>
      <ResponsiveContainer height="100%" width="100%">
        {spec.type === "line" ? (
          <LineChart data={chart.data} margin={{ bottom: 8, left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey={spec.xKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={formatValue} width={56} />
            <Tooltip formatter={formatValue} />
            {chart.yKeys.map((key, index) => (
              <Line dataKey={key} key={key} stroke={colors[index % colors.length]} strokeWidth={2.5} type="monotone" />
            ))}
          </LineChart>
        ) : (
          <BarChart data={chart.data} margin={{ bottom: 8, left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey={spec.xKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={formatValue} width={56} />
            <Tooltip formatter={formatValue} />
            {chart.yKeys.map((key, index) => (
              <Bar dataKey={key} fill={colors[index % colors.length]} key={key} radius={[5, 5, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function ShowcaseResultPreview({ chartSpec, result }: ShowcaseResultPreviewProps) {
  const rows = result?.rows.slice(0, 5) ?? [];
  const columns = result?.columns.slice(0, 5) ?? [];

  return (
    <section className="showcase-card showcase-result-preview">
      <div className="showcase-card__heading">
        <h2>Result Preview</h2>
        <span>{result?.rowCount ?? 0} rows</span>
      </div>
      {chartSpec ? <Chart spec={chartSpec} /> : <p className="showcase-muted">No chart generated.</p>}
      {rows.length > 0 ? (
        <div className="showcase-mini-table">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={column}>{formatValue(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="showcase-muted">No rows returned.</p>
      )}
    </section>
  );
}
