import type { Topic } from "../../topics/topicTypes";

interface TopicCardProps {
  onOpen: (topicId: string) => void;
  topic: Topic;
}

export function TopicCard({ onOpen, topic }: TopicCardProps) {
  return (
    <article className="topic-card">
      <div>
        <p className="topic-card__source">{topic.sourceType}</p>
        <h3>{topic.name}</h3>
        <p>{topic.description}</p>
      </div>
      <div className="tag-row">
        {topic.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <button className="text-button" onClick={() => onOpen(topic.id)} type="button">
        Try it now
      </button>
    </article>
  );
}

