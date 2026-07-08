import { sensitiveColumnNames } from "../../agent/schema";
import type { Topic } from "../../topics/topicTypes";
import { Card } from "../ui/Card";
import { StatusPill } from "../ui/StatusPill";

interface TopicHealthCardProps {
  topic: Topic;
}

export function TopicHealthCard({ topic }: TopicHealthCardProps) {
  const items = [
    ["Data sources", String(topic.dataSources.length)],
    ["Glossary terms", String(topic.glossary.length)],
    ["Sample questions", String(topic.sampleQuestions.length)],
    ["Sensitive fields marked", sensitiveColumnNames.length > 0 ? "Yes" : "No"]
  ];

  return (
    <Card className="topic-health-card">
      <div className="panel__heading">
        <h2>Topic Health</h2>
        <StatusPill tone="planned">Not wired yet</StatusPill>
      </div>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div>
          <dt>Execution status</dt>
          <dd>Not wired yet</dd>
        </div>
      </dl>
    </Card>
  );
}

