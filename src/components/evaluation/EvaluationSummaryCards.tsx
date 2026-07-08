import type { EvaluationSummary } from "../../evaluation/evaluationTypes";

interface EvaluationSummaryCardsProps {
  summary: EvaluationSummary;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    style: "percent"
  }).format(value);
}

export function EvaluationSummaryCards({ summary }: EvaluationSummaryCardsProps) {
  const cards = [
    ["Total cases", summary.totalCases],
    ["Pass rate", formatPercent(summary.passRate)],
    ["Passed", summary.passedCases],
    ["Failed", summary.failedCases],
    ["Needs review", summary.needsReviewCases],
    ["Blocked expected", summary.blockedCases]
  ] as const;

  return (
    <section className="evaluation-summary-grid" aria-label="Evaluation summary">
      {cards.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}
