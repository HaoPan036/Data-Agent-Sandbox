import type { Topic } from "../../topics/topicTypes";
import { Badge } from "../ui/Badge";

interface TopicHeaderProps {
  topic: Topic;
}

export function TopicHeader({ topic }: TopicHeaderProps) {
  return (
    <section className="topic-header">
      <div>
        <div className="topic-header__badges">
          <Badge tone="blue">{topic.sourceType}</Badge>
          <Badge tone="green">{topic.status}</Badge>
          {topic.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
        <h2>{topic.name}</h2>
        <p>{topic.description}</p>
      </div>
      <div className="topic-header__meta">
        <span>Semantic model and topic layer implemented</span>
        <strong>Deterministic execution coming next</strong>
      </div>
    </section>
  );
}

