import { useState } from "react";
import { ChatComposer } from "../components/layout/ChatComposer";
import { RightContents } from "../components/layout/RightContents";
import { DataSourceOverview } from "../components/topic/DataSourceOverview";
import { GlossaryPreview } from "../components/topic/GlossaryPreview";
import { SampleQuestionList } from "../components/topic/SampleQuestionList";
import { TopicHeader } from "../components/topic/TopicHeader";
import { TopicHealthCard } from "../components/topic/TopicHealthCard";
import { TopicInfoCard } from "../components/topic/TopicInfoCard";
import { TopicSummary } from "../components/topic/TopicSummary";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import type { Topic } from "../topics/topicTypes";

interface TopicDetailPageProps {
  topic: Topic;
}

const contents = ["Information", "Summary", "Data Sources", "Glossary", "Sample Questions"];

export function TopicDetailPage({ topic }: TopicDetailPageProps) {
  const [selectedQuestion, setSelectedQuestion] = useState(topic.sampleQuestions[0] ?? "");
  const [message, setMessage] = useState("");

  function handleRun() {
    setMessage(
      "Execution is not wired yet. Next stage connects this question to deterministic workflows."
    );
  }

  function handleSkills() {
    setMessage(
      "Reusable Skills are documented in the topic layer. Execution wiring comes next."
    );
  }

  return (
    <div className="topic-detail-layout">
      <div className="page-stack">
        <TopicHeader topic={topic} />
        <TopicInfoCard topic={topic} />
        <TopicSummary topic={topic} />
        <DataSourceOverview topic={topic} />
        <GlossaryPreview topic={topic} />

        <Card>
          <h2>What This Topic Can Answer</h2>
          <ul className="answer-list">
            {topic.sampleQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </Card>

        <SampleQuestionList
          onSelectQuestion={(question) => {
            setSelectedQuestion(question);
            setMessage(
              "Selected question is ready. Execution will be implemented in the next stage."
            );
          }}
          questions={topic.sampleQuestions}
          selectedQuestion={selectedQuestion}
        />

        <ChatComposer
          message={message}
          onChange={(value) => {
            setSelectedQuestion(value);
            setMessage("");
          }}
          onSkills={handleSkills}
          onRun={handleRun}
          value={selectedQuestion}
        />
      </div>

      <aside className="topic-right-rail">
        <RightContents items={contents} />
        <TopicHealthCard topic={topic} />
        <EmptyState title="Next Stage">
          Sample questions will wire into intent routing, SQL planning, validation,
          local execution, trace logging, and grounded answers.
        </EmptyState>
      </aside>
    </div>
  );
}
