import type { Topic } from "../../topics/topicTypes";
import { StatusPill } from "../ui/StatusPill";

interface TopicInfoCardProps {
  topic: Topic;
}

export function TopicInfoCard({ topic }: TopicInfoCardProps) {
  const items = [
    ["Owner", `${topic.owner.ownerName} · ${topic.owner.ownerEmail}`],
    ["Access", topic.accessLevel],
    ["Source", topic.sourceType],
    ["Created", topic.createdAt],
    ["Updated", topic.updatedAt],
    ["Governance status", "Sensitive policy ready"]
  ];

  return (
    <section className="panel" id="information">
      <div className="panel__heading">
        <h2>Information</h2>
        <StatusPill tone="ready">{topic.status}</StatusPill>
      </div>
      <dl className="info-grid">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
