import { useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { getTopicById, topicCatalog } from "./topics/topicCatalog";

export default function App() {
  const [activeTopicId, setActiveTopicId] = useState<string | undefined>();
  const [initialTopicQuestion, setInitialTopicQuestion] = useState<string | undefined>();
  const activeTopic = useMemo(
    () => (activeTopicId ? getTopicById(activeTopicId) : undefined),
    [activeTopicId]
  );

  function handleOpenOverview() {
    setActiveTopicId(undefined);
    setInitialTopicQuestion(undefined);
  }

  function handleOpenTopic(topicId: string, initialQuestion?: string) {
    setActiveTopicId(topicId);
    setInitialTopicQuestion(initialQuestion);
  }

  return (
    <AppShell
      activeTopicId={activeTopic?.id}
      onOpenOverview={handleOpenOverview}
      onOpenTopic={handleOpenTopic}
      pageTitle={activeTopic?.name ?? "Overview"}
      topics={topicCatalog}
    >
      {activeTopic ? (
        <TopicDetailPage
          initialQuestion={initialTopicQuestion}
          key={`${activeTopic.id}:${initialTopicQuestion ?? ""}`}
          topic={activeTopic}
        />
      ) : (
        <OverviewPage onOpenTopic={handleOpenTopic} topics={topicCatalog} />
      )}
    </AppShell>
  );
}
