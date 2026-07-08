import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

interface CapabilityCardProps {
  description: string;
  status: "Implemented" | "Next stage";
  title: string;
}

export function CapabilityCard({ description, status, title }: CapabilityCardProps) {
  return (
    <Card className="capability-card">
      <div className="capability-card__topline">
        <span className="capability-card__mark" aria-hidden="true" />
        <Badge tone={status === "Implemented" ? "green" : "amber"}>{status}</Badge>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </Card>
  );
}

