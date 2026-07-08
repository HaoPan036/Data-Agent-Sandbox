import type { Topic } from "../../topics/topicTypes";
import { StatusPill } from "../ui/StatusPill";

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
                <StatusPill tone={session.status.toLowerCase() as "draft" | "reviewed" | "evaluated"}>
                  {session.status}
                </StatusPill>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
