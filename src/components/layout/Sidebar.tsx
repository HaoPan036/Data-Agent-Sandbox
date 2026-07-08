import type { Topic } from "../../topics/topicTypes";
import { RecentSessionTree } from "../topic/RecentSessionTree";
import { Badge } from "../ui/Badge";

interface SidebarProps {
  activeTopicId?: string;
  onOpenOverview: () => void;
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
  topics: Topic[];
}

export function Sidebar({
  activeTopicId,
  onOpenOverview,
  onOpenTopic,
  topics
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <button className="brand-button" onClick={onOpenOverview} type="button">
          <span>Data Agent Sandbox</span>
          <small>Public BI Agent Lab</small>
        </button>
      </div>

      <button className="new-topic-button" disabled type="button">
        New Topic
        <span>Coming soon</span>
      </button>

      <nav aria-label="Recent sessions" className="sidebar__section">
        <h2>Recent Sessions</h2>
        <RecentSessionTree onOpenTopic={onOpenTopic} topics={topics} />
      </nav>

      <nav aria-label="Available topics" className="sidebar__section">
        <h2>Available Topics</h2>
        <div className="topic-nav-list">
          {topics.map((topic) => (
            <button
              className={
                topic.id === activeTopicId ? "topic-nav topic-nav--active" : "topic-nav"
              }
              key={topic.id}
              onClick={() => onOpenTopic(topic.id)}
              type="button"
            >
              <span>{topic.name}</span>
              <span className="topic-nav__labels">
                <Badge tone="blue">Demo</Badge>
                <Badge tone={topic.sourceType === "Markdown Knowledge" ? "violet" : "green"}>
                  {topic.sourceType === "Markdown Knowledge" ? "Knowledge" : "Synthetic"}
                </Badge>
              </span>
            </button>
          ))}
        </div>
      </nav>

      <div className="sidebar__user">
        <strong>Hao Pan</strong>
        <span>Portfolio Demo</span>
      </div>
    </aside>
  );
}
