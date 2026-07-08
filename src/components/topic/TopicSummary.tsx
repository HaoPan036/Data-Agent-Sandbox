import type { Topic } from "../../topics/topicTypes";
import { StatusPill } from "../ui/StatusPill";

interface TopicSummaryProps {
  topic: Topic;
}

export function TopicSummary({ topic }: TopicSummaryProps) {
  return (
    <section className="panel" id="summary">
      <h2>Summary</h2>
      <p>{topic.description}</p>
      <div className="governance-grid">
        {Object.entries(topic.governanceStatus).map(([key, value]) => (
          <div key={key}>
            <span>{key.replace(/([A-Z])/g, " $1")}</span>
            <StatusPill tone={value === "Ready" ? "ready" : "planned"}>{value}</StatusPill>
          </div>
        ))}
      </div>
    </section>
  );
}
