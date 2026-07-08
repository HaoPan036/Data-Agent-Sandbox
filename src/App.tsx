import { useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { EvaluationPage } from "./pages/EvaluationPage";
import { OverviewPage } from "./pages/OverviewPage";
import { TopicDetailPage } from "./pages/TopicDetailPage";
import { getTopicById, topicCatalog } from "./topics/topicCatalog";

type ActivePage = "overview" | "evaluation" | "topic";

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("overview");
  const [activeTopicId, setActiveTopicId] = useState<string | undefined>();
  const [initialTopicQuestion, setInitialTopicQuestion] = useState<string | undefined>();
  const activeTopic = useMemo(
    () => (activeTopicId ? getTopicById(activeTopicId) : undefined),
    [activeTopicId]
  );

  function handleOpenOverview() {
    setActivePage("overview");
    setActiveTopicId(undefined);
    setInitialTopicQuestion(undefined);
  }

  function handleOpenEvaluation() {
    setActivePage("evaluation");
    setActiveTopicId(undefined);
    setInitialTopicQuestion(undefined);
  }

  function handleOpenTopic(topicId: string, initialQuestion?: string) {
    setActivePage("topic");
    setActiveTopicId(topicId);
    setInitialTopicQuestion(initialQuestion);
  }

  const pageTitle =
    activePage === "evaluation" ? "Evaluation" : activeTopic?.name ?? "Overview";

  return (
    <AppShell
      activePage={activePage}
      activeTopicId={activeTopic?.id}
      onOpenEvaluation={handleOpenEvaluation}
      onOpenOverview={handleOpenOverview}
      onOpenTopic={handleOpenTopic}
      pageTitle={pageTitle}
      topics={topicCatalog}
    >
      {activePage === "evaluation" ? (
        <EvaluationPage />
      ) : activeTopic ? (
        <TopicDetailPage
          initialQuestion={initialTopicQuestion}
          key={`${activeTopic.id}:${initialTopicQuestion ?? ""}`}
          onOpenEvaluation={handleOpenEvaluation}
          topic={activeTopic}
        />
      ) : (
        <OverviewPage
          onOpenEvaluation={handleOpenEvaluation}
          onOpenTopic={handleOpenTopic}
          topics={topicCatalog}
        />
      )}
    </AppShell>
  );
}
