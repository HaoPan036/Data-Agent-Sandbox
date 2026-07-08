import { useState } from "react";
import { ChatComposer } from "../components/layout/ChatComposer";
import { RightContents } from "../components/layout/RightContents";
import { DataSourceOverview } from "../components/topic/DataSourceOverview";
import { GlossaryPreview } from "../components/topic/GlossaryPreview";
import { SampleQuestionList } from "../components/topic/SampleQuestionList";
import { TopicInfoCard } from "../components/topic/TopicInfoCard";
import { TopicSummary } from "../components/topic/TopicSummary";
import type { Topic } from "../topics/topicTypes";

interface TopicDetailPageProps {
  topic: Topic;
}

const contents = ["Information", "Summary", "Data Sources", "Glossary", "Sample Questions"];

export function TopicDetailPage({ topic }: TopicDetailPageProps) {
  const [selectedQuestion, setSelectedQuestion] = useState(topic.sampleQuestions[0] ?? "");
  const [message, setMessage] = useState("");

  function handleRun() {
    setMessage("Agent execution will be implemented in the next stage.");
  }

  return (
    <div className="topic-detail-layout">
      <div className="page-stack">
        <TopicInfoCard topic={topic} />
        <TopicSummary topic={topic} />
        <DataSourceOverview topic={topic} />
        <GlossaryPreview topic={topic} />

        <section className="panel">
          <h2>What This Topic Can Answer</h2>
          <ul className="answer-list">
            {topic.sampleQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>

        <SampleQuestionList
          onSelectQuestion={(question) => {
            setSelectedQuestion(question);
            setMessage("");
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
          onRun={handleRun}
          value={selectedQuestion}
        />
      </div>

      <RightContents items={contents} />
    </div>
  );
}

