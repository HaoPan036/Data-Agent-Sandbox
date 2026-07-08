import type { Topic } from "../../topics/topicTypes";

interface RecentSessionTreeProps {
  onOpenTopic: (topicId: string) => void;
  topics: Topic[];
}

export function RecentSessionTree({ onOpenTopic, topics }: RecentSessionTreeProps) {
  return (
    <div className="session-tree">
      {topics.map((topic) => (
        <details key={topic.id} open>
          <summary>
            <button onClick={() => onOpenTopic(topic.id)} type="button">
              {topic.name}
            </button>
          </summary>
          <ul>
            {topic.sessions.map((session) => (
              <li key={session.id}>
                <span>{session.title}</span>
                <small>{session.status}</small>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

