import { sensitiveColumnNames } from "../../agent/schema";
import type { Topic } from "../../topics/topicTypes";
import { Card } from "../ui/Card";
import { StatusPill } from "../ui/StatusPill";

interface TopicHealthCardProps {
  topic: Topic;
}

function supportStatus(topicId: string) {
  if (topicId === "retail-growth-demo") {
    return { label: "Retail 5", status: "Ready", tone: "ready" as const };
  }

  if (topicId === "experiment-metrics-demo") {
    return { label: "Experiment 5", status: "Ready", tone: "ready" as const };
  }

  return { label: "Knowledge planned", status: "Planned", tone: "planned" as const };
}

export function TopicHealthCard({ topic }: TopicHealthCardProps) {
  const support = supportStatus(topic.id);
  const items = [
    ["Data sources", String(topic.dataSources.length)],
    ["Glossary terms", String(topic.glossary.length)],
    ["Sample questions", String(topic.sampleQuestions.length)],
    ["Supported now", support.label],
    ["Sensitive fields marked", sensitiveColumnNames.length > 0 ? "Yes" : "No"]
  ];

  return (
    <Card className="topic-health-card">
      <div className="panel__heading">
        <h2>Topic Health</h2>
        <StatusPill tone={support.tone}>{support.status}</StatusPill>
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
          <dd>{support.status}</dd>
        </div>
      </dl>
    </Card>
  );
}
