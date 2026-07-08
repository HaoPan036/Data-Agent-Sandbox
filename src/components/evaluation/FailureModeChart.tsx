import type { FailureModeLabel } from "../../evaluation/evaluationTypes";

interface FailureModeChartProps {
  counts: Record<FailureModeLabel, number>;
}

export function FailureModeChart({ counts }: FailureModeChartProps) {
  const rows = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1]);
  const maxCount = Math.max(1, ...rows.map(([, count]) => count));

  return (
    <section className="evaluation-panel">
      <h2>Failure Mode Distribution</h2>
      {rows.length === 0 ? (
        <p className="muted">No failure modes recorded.</p>
      ) : (
        <div className="failure-mode-list">
          {rows.map(([mode, count]) => (
            <div key={mode}>
              <span>{mode.replaceAll("_", " ")}</span>
              <div>
                <span style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
