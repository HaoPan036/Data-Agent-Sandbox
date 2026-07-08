interface ShowcaseMetricCardProps {
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "violet";
  value: string | number;
}

export function ShowcaseMetricCard({ label, tone = "blue", value }: ShowcaseMetricCardProps) {
  return (
    <article className={`showcase-metric-card showcase-metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
