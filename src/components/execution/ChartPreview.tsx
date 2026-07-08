import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AgentChartSpec, QueryRow } from "../../agent/types";

interface ChartPreviewProps {
  spec?: AgentChartSpec;
}

const colors = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#dc2626", "#475569"];

function formatMetric(value: unknown) {
  if (typeof value !== "number") {
    return String(value ?? "");
  }

  if (Math.abs(value) < 1) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, style: "percent" }).format(value);
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function numberValue(row: QueryRow | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "number" ? value : Number(value ?? 0);
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

export function ChartPreview({ spec }: ChartPreviewProps) {
  if (!spec) {
    return null;
  }

  if (spec.type === "kpi") {
    const row = spec.data[0];

    return (
      <section className="execution-section">
        <h3>{spec.title}</h3>
        <div className="kpi-grid">
          {spec.yKeys.map((key) => (
            <div key={key}>
              <span>{key.replaceAll("_", " ")}</span>
              <strong>{formatMetric(row?.[key])}</strong>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (spec.type === "status") {
    const row = spec.data[0];
    const availableDays = numberValue(row, "available_days");
    const expectedDays = numberValue(row, "expected_days");

    return (
      <section className="execution-section">
        <h3>{spec.title}</h3>
        <div className="completeness-meter">
          <span>{availableDays < expectedDays ? "Incomplete" : "Complete"}</span>
          <strong>
            {availableDays} / {expectedDays} days
          </strong>
          <div>
            <span style={{ width: `${Math.min(100, (availableDays / expectedDays) * 100)}%` }} />
          </div>
        </div>
      </section>
    );
  }

  const chartData = pivotSeries(spec);
  const commonProps = {
    data: chartData.data,
    height: 300,
    margin: { bottom: 20, left: 24, right: 24, top: 12 },
    width: 760
  };

  return (
    <section className="execution-section">
      <h3>{spec.title}</h3>
      <div className="chart-scroll" aria-label={`${spec.title} chart`}>
        {spec.type === "line" ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey={spec.xKey} />
            <YAxis tickFormatter={formatMetric} width={88} />
            <Tooltip formatter={formatMetric} />
            {chartData.yKeys.map((key, index) => (
              <Line
                activeDot={{ r: 5 }}
                dataKey={key}
                key={key}
                name={key.replaceAll("_", " ")}
                stroke={colors[index % colors.length]}
                strokeWidth={2.5}
                type="monotone"
              />
            ))}
          </LineChart>
        ) : (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey={spec.xKey} />
            <YAxis tickFormatter={formatMetric} width={88} />
            <Tooltip formatter={formatMetric} />
            {chartData.yKeys.map((key, index) => (
              <Bar
                dataKey={key}
                fill={colors[index % colors.length]}
                key={key}
                name={key.replaceAll("_", " ")}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </div>
    </section>
  );
}
