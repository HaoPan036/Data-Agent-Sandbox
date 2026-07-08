import type { Topic } from "../../topics/topicTypes";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface TopicShowcaseCardProps {
  onOpen: (topicId: string) => void;
  topic: Topic;
}

export function TopicShowcaseCard({ onOpen, topic }: TopicShowcaseCardProps) {
  return (
    <Card className="topic-showcase-card">
      <div className="topic-showcase-card__header">
        <Badge tone={topic.sourceType === "Markdown Knowledge" ? "violet" : "blue"}>
          {topic.sourceType}
        </Badge>
        <Badge tone="green">{topic.status}</Badge>
      </div>
      <div>
        <h3>{topic.name}</h3>
        <p>{topic.description}</p>
      </div>
      <dl className="topic-stat-grid">
        <div>
          <dt>Sources</dt>
          <dd>{topic.dataSources.length}</dd>
        </div>
        <div>
          <dt>Glossary</dt>
          <dd>{topic.glossary.length}</dd>
        </div>
        <div>
          <dt>Questions</dt>
          <dd>{topic.sampleQuestions.length}</dd>
        </div>
      </dl>
      <div className="tag-row">
        {topic.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <Button onClick={() => onOpen(topic.id)} variant="secondary">
        Try it now
      </Button>
    </Card>
  );
}

