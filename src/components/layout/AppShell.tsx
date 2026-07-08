import type { ReactNode } from "react";
import type { Topic } from "../../topics/topicTypes";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  activePage: "overview" | "evaluation" | "topic";
  activeTopicId?: string;
  children: ReactNode;
  onOpenEvaluation: () => void;
  onOpenOverview: () => void;
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
  pageTitle: string;
  topics: Topic[];
}

export function AppShell({
  activePage,
  activeTopicId,
  children,
  onOpenEvaluation,
  onOpenOverview,
  onOpenTopic,
  pageTitle,
  topics
}: AppShellProps) {
  return (
    <div className="platform-shell">
      <Sidebar
        activePage={activePage}
        activeTopicId={activeTopicId}
        onOpenEvaluation={onOpenEvaluation}
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
