import type { Topic } from "../../topics/topicTypes";

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
    ["Status", topic.status]
  ];

  return (
    <section className="panel" id="information">
      <div className="panel__heading">
        <h2>Information</h2>
        <span className="status status--ready">{topic.status}</span>
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

