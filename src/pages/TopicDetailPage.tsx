import { useRef, useState } from "react";
import { runAgent } from "../agent/runAgent";
import type { AgentRun } from "../agent/types";
import {
  ExecutionProgressPanel,
  type ExecutionProgressStep
} from "../components/execution/ExecutionProgressPanel";
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

const runStepDelayMs = 420;

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function rowCount(run: AgentRun) {
  return run.executionResult.reduce((total, result) => total + result.rowCount, 0);
}

function createExecutionSteps(input: string, topic: Topic, run: AgentRun): ExecutionProgressStep[] {
  const passedChecks = run.validationResults.filter((result) => result.passed).length;
  const validationStatus = run.validationResults.some((result) => result.severity === "error" && !result.passed)
    ? "failed"
    : run.validationResults.some((result) => !result.passed)
      ? "warning"
      : "completed";
  const sqlArtifact =
    run.generatedSql.length > 0
      ? run.generatedSql.map((statement) => statement.sql).join("\n\n")
      : "No SQL generated for this request.";
  const executionRows = rowCount(run);

  return [
    {
      id: "input",
      label: "Input captured",
      status: "completed",
      detail: input,
      artifact: `Topic: ${topic.name}\nSource: ${topic.sourceType}`
    },
    {
      id: "intent",
      label: "Intent routed",
      status: run.intent === "unknown" ? "warning" : "completed",
      detail: `Intent: ${titleCase(run.intent)}. Guardrail decision: ${titleCase(run.guardrailDecision)}.`
    },
    {
      id: "sql",
      label: "SQL generated",
      status: run.generatedSql.length > 0 ? "completed" : run.guardrailDecision === "blocked" ? "blocked" : "warning",
      detail:
        run.generatedSql.length > 0
          ? `Generated ${run.generatedSql.length} read-only SQL statement(s).`
          : "The agent did not generate SQL for this request.",
      artifact: sqlArtifact
    },
    {
      id: "validation",
      label: "SQL validated",
      status: run.validationResults.length > 0 ? validationStatus : run.guardrailDecision === "blocked" ? "blocked" : "warning",
      detail:
        run.validationResults.length > 0
          ? `${passedChecks}/${run.validationResults.length} validation checks passed.`
          : "No validation checks were needed because SQL generation stopped."
    },
    {
      id: "execution",
      label: "SQL executed",
      status: run.executionResult.length > 0 ? "completed" : run.guardrailDecision === "blocked" ? "blocked" : "warning",
      detail:
        run.executionResult.length > 0
          ? `AlaSQL returned ${executionRows} row(s) from synthetic browser tables.`
          : "No SQL execution was performed.",
      artifact:
        run.executionResult.length > 0
          ? `Rows: ${executionRows}\nTables: ${run.selectedTables.join(", ")}`
          : undefined
    },
    {
      id: "output",
      label: "Output produced",
      status: run.status === "blocked" ? "blocked" : run.status === "failed" ? "failed" : "completed",
      detail: run.finalAnswer
    }
  ];
}

export function TopicDetailPage({ initialQuestion, onOpenEvaluation, topic }: TopicDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TopicTab>("run");
  const [selectedQuestion, setSelectedQuestion] = useState(
    initialQuestion ?? topic.sampleQuestions[0] ?? ""
  );
  const [message, setMessage] = useState(initialQuestion ? "Selected question is ready to run." : "");
  const [agentRun, setAgentRun] = useState<AgentRun | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [runInput, setRunInput] = useState("");
  const [progressSteps, setProgressSteps] = useState<ExecutionProgressStep[]>([]);
  const runSequence = useRef(0);

  async function handleRun() {
    const input = selectedQuestion.trim();

    if (!input) {
      setMessage("Enter a business question before running the topic.");
      return;
    }

    const sequence = runSequence.current + 1;
    runSequence.current = sequence;
    setAgentRun(undefined);
    setProgressSteps([]);
    setRunInput(input);
    setIsRunning(true);
    setMessage("Running deterministic agent. Follow each execution step below.");

    const run = runAgent(input, topic.id);
    const nextSteps = createExecutionSteps(input, topic, run);

    for (const step of nextSteps) {
      if (sequence !== runSequence.current) {
        return;
      }

      setProgressSteps((currentSteps) => [...currentSteps, { ...step, status: "running" }]);
      await wait(runStepDelayMs);

      if (sequence !== runSequence.current) {
        return;
      }

      setProgressSteps((currentSteps) =>
        currentSteps.map((candidate) => (candidate.id === step.id ? step : candidate))
      );
    }

    if (sequence !== runSequence.current) {
      return;
    }

    setAgentRun(run);
    setIsRunning(false);
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
                setAgentRun(undefined);
                setProgressSteps([]);
                setRunInput("");
              }}
              questions={topic.sampleQuestions}
              selectedQuestion={selectedQuestion}
              supportedLabel={supportedLabel(topic.id)}
            />

            <ChatComposer
              isRunning={isRunning}
              message={message}
              onChange={(value) => {
                setSelectedQuestion(value);
                setMessage("");
                setAgentRun(undefined);
                setProgressSteps([]);
                setRunInput("");
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

            {isRunning || progressSteps.length > 0 ? (
              <ExecutionProgressPanel
                input={runInput}
                isRunning={isRunning}
                steps={progressSteps}
              />
            ) : null}

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
