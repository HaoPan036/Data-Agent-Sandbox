import { useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { getTopicById, topicCatalog } from "./topics/topicCatalog";

export default function App() {
  const [activeTopicId, setActiveTopicId] = useState<string | undefined>();
  const activeTopic = useMemo(
    () => (activeTopicId ? getTopicById(activeTopicId) : undefined),
    [activeTopicId]
  );

  return (
    <AppShell
      activeTopicId={activeTopic?.id}
      onOpenOverview={() => setActiveTopicId(undefined)}
      onOpenTopic={setActiveTopicId}
      pageTitle={activeTopic?.name ?? "Overview"}
      topics={topicCatalog}
    >
      {activeTopic ? (
        <TopicDetailPage key={activeTopic.id} topic={activeTopic} />
      ) : (
        <OverviewPage onOpenTopic={setActiveTopicId} topics={topicCatalog} />
      )}
    </AppShell>
  );
}

