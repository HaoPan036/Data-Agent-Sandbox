import { Badge } from "../ui/Badge";

const statusChips = [
  ["Topic layer", "Implemented"],
  ["Metric catalog", "Implemented"],
  ["SQL validation", "Implemented"],
  ["Local execution", "Implemented"],
  ["Trace timeline", "Implemented"],
  ["Evaluation dashboard", "Next"],
  ["Skill reports", "Next"]
] as const;

export function StatusChipGrid() {
  return (
    <section className="status-chip-grid" aria-label="What works now">
      {statusChips.map(([label, status]) => (
        <div className="status-chip" key={label}>
          <span>{label}</span>
          <Badge tone={status === "Implemented" ? "green" : "amber"}>{status}</Badge>
        </div>
      ))}
    </section>
  );
}
