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
import type { ChartSpec, QueryRow } from "../agent/types";
import { formatCurrency, formatNumber } from "../utils/format";

interface ChartPanelProps {
  data: QueryRow[];
  spec: ChartSpec;
}

function formatMetric(value: unknown) {
  if (typeof value !== "number") {
    return String(value ?? "");
  }

  return value > 999 ? formatCurrency(value) : formatNumber(value);
}

export function ChartPanel({ data, spec }: ChartPanelProps) {
  const commonProps = {
    data,
    height: 300,
    margin: { bottom: 20, left: 24, right: 24, top: 12 },
    width: 760
  };

  return (
    <div className="chart-scroll" aria-label={`${spec.yLabel} chart`}>
      {spec.type === "line" ? (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey={spec.xKey} />
          <YAxis tickFormatter={formatMetric} width={88} />
          <Tooltip formatter={formatMetric} />
          <Line
            activeDot={{ r: 6 }}
            dataKey={spec.yKey}
            name={spec.yLabel}
            stroke="#2563eb"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      ) : (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey={spec.xKey} />
          <YAxis tickFormatter={formatMetric} width={88} />
          <Tooltip formatter={formatMetric} />
          <Bar dataKey={spec.yKey} fill="#0f766e" name={spec.yLabel} radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </div>
  );
}

