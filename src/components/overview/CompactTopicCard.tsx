import type { Topic } from "../../topics/topicTypes";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface CompactTopicCardProps {
  onOpen: (topicId: string) => void;
  onRunSample: (topicId: string, question: string) => void;
  topic: Topic;
}

function metricCount(topic: Topic) {
  return new Set(topic.glossary.map((item) => item.metricId).filter(Boolean)).size;
}

function tableCount(topic: Topic) {
  return topic.dataSources.filter((source) => source.tableName).length;
}

export function CompactTopicCard({ onOpen, onRunSample, topic }: CompactTopicCardProps) {
  const sampleQuestion = topic.sampleQuestions[0] ?? "";

  return (
    <Card className="compact-topic-card">
      <div className="compact-topic-card__top">
        <Badge tone={topic.sourceType === "Markdown Knowledge" ? "violet" : "blue"}>
          {topic.sourceType}
        </Badge>
        <Badge tone={topic.id === "knowledge-base-demo" ? "amber" : "green"}>
          {topic.id === "knowledge-base-demo" ? "Metadata" : "Live"}
        </Badge>
      </div>
      <div>
        <h3>{topic.name}</h3>
        <p>{topic.description}</p>
      </div>
      <dl className="compact-topic-stats">
        <div>
          <dt>Tables</dt>
          <dd>{tableCount(topic)}</dd>
        </div>
        <div>
          <dt>Metrics</dt>
          <dd>{metricCount(topic)}</dd>
        </div>
        <div>
          <dt>Questions</dt>
          <dd>{topic.sampleQuestions.length}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{topic.governanceStatus.sqlValidation}</dd>
        </div>
      </dl>
      <div className="compact-topic-actions">
        <Button onClick={() => onOpen(topic.id)} variant="secondary">
          Open
        </Button>
        <Button onClick={() => onRunSample(topic.id, sampleQuestion)} variant="ghost">
          Run sample
        </Button>
      </div>
    </Card>
  );
}
