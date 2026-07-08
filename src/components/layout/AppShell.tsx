import type { ReactNode } from "react";
import type { Topic } from "../../topics/topicTypes";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  activeTopicId?: string;
  children: ReactNode;
  onOpenOverview: () => void;
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
  pageTitle: string;
  topics: Topic[];
}

export function AppShell({
  activeTopicId,
  children,
  onOpenOverview,
  onOpenTopic,
  pageTitle,
  topics
}: AppShellProps) {
  return (
    <div className="platform-shell">
      <Sidebar
        activeTopicId={activeTopicId}
        onOpenOverview={onOpenOverview}
        onOpenTopic={onOpenTopic}
        topics={topics}
      />
      <div className="platform-main">
        <TopBar pageTitle={pageTitle} />
        {children}
      </div>
    </div>
  );
}
