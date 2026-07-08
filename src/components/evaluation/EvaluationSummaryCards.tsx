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
    ["Total cases", summary.totalCases, "blue"],
    ["Pass rate", formatPercent(summary.passRate), "green"],
    ["Passed", summary.passedCases, "green"],
    ["Failed", summary.failedCases, "red"],
    ["Needs review", summary.needsReviewCases, "amber"],
    ["Blocked expected", summary.blockedCases, "violet"]
  ] as const;

  return (
    <section className="evaluation-summary-grid" aria-label="Evaluation summary">
      {cards.map(([label, value, tone]) => (
        <div className={`evaluation-summary-card evaluation-summary-card--${tone}`} key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}
