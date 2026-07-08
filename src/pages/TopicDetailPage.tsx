import { useState } from "react";
import { runAgent } from "../agent/runAgent";
import type { AgentRun } from "../agent/types";
import { ExecutionResultPanel } from "../components/execution/ExecutionResultPanel";
import { ChatComposer } from "../components/layout/ChatComposer";
import { RightContents } from "../components/layout/RightContents";
import { DataSourceOverview } from "../components/topic/DataSourceOverview";
import { GlossaryPreview } from "../components/topic/GlossaryPreview";
import { SampleQuestionList } from "../components/topic/SampleQuestionList";
import { TopicHeader } from "../components/topic/TopicHeader";
import { TopicHealthCard } from "../components/topic/TopicHealthCard";
import { TopicInfoCard } from "../components/topic/TopicInfoCard";
import { TopicSummary } from "../components/topic/TopicSummary";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import type { Topic } from "../topics/topicTypes";

interface TopicDetailPageProps {
  initialQuestion?: string;
  onOpenEvaluation?: () => void;
  topic: Topic;
}

const contents = ["Information", "Summary", "Data Sources", "Glossary", "Sample Questions", "Execution"];
type TopicTab = "run" | "data" | "glossary" | "trace";

const tabs: Array<[TopicTab, string]> = [
  ["run", "Run"],
  ["data", "Data"],
  ["glossary", "Glossary"],
  ["trace", "Trace Notes"]
];

function supportedLabel(topicId: string) {
  if (topicId === "retail-growth-demo") {
    return "Supported now: Retail 5.";
  }

  if (topicId === "experiment-metrics-demo") {
    return "Supported now: Experiment 5.";
  }

  return "Knowledge base retrieval execution is planned for a later stage.";
}

function executionCallout(topicId: string) {
  if (topicId === "knowledge-base-demo") {
    return "Metadata only. Retrieval execution planned later.";
  }

  return "Supported now: This topic can execute selected deterministic questions end to end.";
}

export function TopicDetailPage({ initialQuestion, onOpenEvaluation, topic }: TopicDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TopicTab>("run");
  const [selectedQuestion, setSelectedQuestion] = useState(
    initialQuestion ?? topic.sampleQuestions[0] ?? ""
  );
  const [message, setMessage] = useState(initialQuestion ? "Selected question is ready to run." : "");
  const [agentRun, setAgentRun] = useState<AgentRun | undefined>();

  function handleRun() {
    const run = runAgent(selectedQuestion, topic.id);
    setAgentRun(run);
    setMessage(
      run.status === "blocked"
        ? "Request blocked by guardrails. See the run details below."
        : run.generatedSql.length === 0
          ? "No executable SQL workflow matched this request. See suggestions below."
        : "Deterministic run completed. SQL, results, chart, trace, and answer are shown below."
    );
  }

  function handleSkills() {
    setMessage(
      "Reusable Skills are represented in the topic layer. The deterministic runner now uses local SQL templates and public metric metadata."
    );
  }

  return (
    <div className="topic-detail-layout">
      <div className="page-stack">
        <TopicHeader topic={topic} />
        <div className="topic-tab-bar" role="tablist" aria-label="Topic detail sections">
          {tabs.map(([tab, label]) => (
            <button
              aria-selected={activeTab === tab}
              className={activeTab === tab ? "topic-tab topic-tab--active" : "topic-tab"}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "run" ? (
          <>
            <SampleQuestionList
              onSelectQuestion={(question) => {
                setSelectedQuestion(question);
                setMessage("Selected question is ready to run.");
              }}
              questions={topic.sampleQuestions}
              selectedQuestion={selectedQuestion}
              supportedLabel={supportedLabel(topic.id)}
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
            <div className="topic-execution-callout">{executionCallout(topic.id)}</div>
            <div className="topic-showcase-callout">
              <span>Screenshot path</span>
              <a className="button button--secondary" href="/showcase?view=agent">
                Open Agent Showcase
              </a>
            </div>

            {agentRun ? <ExecutionResultPanel run={agentRun} /> : null}
          </>
        ) : null}

        {activeTab === "data" ? (
          <>
            <TopicInfoCard topic={topic} />
            <TopicSummary topic={topic} />
            <DataSourceOverview topic={topic} />
          </>
        ) : null}

        {activeTab === "glossary" ? (
          <>
            <GlossaryPreview topic={topic} />
            <Card>
              <h2>What This Topic Can Answer</h2>
              <ul className="answer-list">
                {topic.sampleQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </Card>
          </>
        ) : null}

        {activeTab === "trace" ? (
          <>
            <TopicHealthCard topic={topic} />
            <EmptyState title="Execution Coverage">
              Retail Growth Demo and Experiment Metrics Demo execute deterministic SQL locally.
              Knowledge Base Demo remains metadata-only in this stage.
            </EmptyState>
          </>
        ) : null}
      </div>

      <aside className="topic-right-rail">
        <RightContents items={contents} />
        <TopicHealthCard topic={topic} />
        <EmptyState title="Execution Coverage">
          Retail Growth Demo and Experiment Metrics Demo execute deterministic SQL locally.
          Knowledge Base Demo remains metadata-only in this stage.
        </EmptyState>
        {onOpenEvaluation ? (
          <Button onClick={onOpenEvaluation} variant="secondary">
            Open Evaluation
          </Button>
        ) : null}
      </aside>
    </div>
  );
}
