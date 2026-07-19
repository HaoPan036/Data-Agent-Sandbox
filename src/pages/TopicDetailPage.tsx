import { useEffect, useRef, useState } from "react";
import { AgentClientError, streamAgentRun } from "../agent/agentClient";
import { deriveRunOutcome } from "../agent/runOutcome";
import type {
  AgentRun,
  AgentRunCompletedEvent,
  AgentRunEvent
} from "../agent/types";
import {
  ExecutionProgressPanel,
  type ExecutionProgressStatus,
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

  return "Supported now: This topic can execute selected deterministic questions end to end through the agent API.";
}

function formatDetails(details: Record<string, unknown> | undefined) {
  return details ? JSON.stringify(details, null, 2) : undefined;
}

function startedStep(event: Extract<AgentRunEvent, { type: "run.started" }>): ExecutionProgressStep {
  return {
    id: `server-start-${event.sequence}`,
    label: "Run accepted by server",
    status: "completed",
    detail: "The server accepted this question and opened a deterministic agent run.",
    artifact: `Run ID: ${event.runId}\nTopic: ${event.topicId}\nTransport: ndjson-v1`
  };
}

function traceStep(event: Extract<AgentRunEvent, { type: "step.completed" }>): ExecutionProgressStep {
  return {
    id: event.step.id,
    label: event.step.label,
    status: event.step.status,
    detail: event.step.message,
    artifact: formatDetails(event.step.details)
  };
}

function statusFromRun(run: AgentRun): ExecutionProgressStatus {
  return run.status === "idle" || run.status === "running" ? "completed" : run.status;
}

function completionMessage(run: AgentRun) {
  const outcome = deriveRunOutcome(run);

  if (outcome.isSafelyBlocked) {
    return "Request blocked by guardrails. No SQL was generated or executed.";
  }

  if (run.status === "failed") {
    return "The server completed the run with a failure. Retry the same question to try again.";
  }

  if (outcome.hasOutcomeIntegrityMismatch) {
    return "Outcome integrity validation failed. No result should be used until the server response is reviewed.";
  }

  if (run.guardrailDecision === "needs_review") {
    return "Run completed with a needs-review guardrail decision. Review the warnings, trace, and returned artifacts below.";
  }

  if (!outcome.hasGeneratedSql) {
    return "Run completed without generating SQL. Review the trace and suggested follow-ups below.";
  }

  return "Server run completed. SQL, results, chart, trace, and answer are shown below.";
}

function failureStep(message: string): ExecutionProgressStep {
  return {
    id: "client-failure",
    label: "Run failed",
    status: "failed",
    detail: message
  };
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
  const [runStatus, setRunStatus] = useState<ExecutionProgressStatus | undefined>();
  const [runId, setRunId] = useState<string>();
  const [transport, setTransport] = useState<string>();
  const runSequence = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      runSequence.current += 1;
      abortControllerRef.current?.abort();
    };
  }, []);

  function clearOutput() {
    setIsRunning(false);
    setAgentRun(undefined);
    setProgressSteps([]);
    setRunStatus(undefined);
    setRunId(undefined);
    setTransport(undefined);
  }

  function cancelCurrentRun() {
    if (!isRunning) {
      return;
    }

    runSequence.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsRunning(false);
    setAgentRun(undefined);
    setRunStatus("cancelled");
    setMessage("Client stopped receiving events. A synchronous server computation may have continued; retry to run again.");
  }

  async function handleRun() {
    const input = selectedQuestion.trim();

    if (!input) {
      setMessage("Enter a business question before running the topic.");
      return;
    }

    if (topic.id === "knowledge-base-demo") {
      setMessage("Knowledge Base Demo is metadata-only in this stage. No agent run was started.");
      clearOutput();
      return;
    }

    abortControllerRef.current?.abort();
    const sequence = runSequence.current + 1;
    runSequence.current = sequence;
    clearOutput();
    setProgressSteps([]);
    setRunInput(input);
    setIsRunning(true);
    setRunStatus("running");
    setMessage("Connected to the server. Waiting for execution events...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const isCurrentRun = () => sequence === runSequence.current;
    const onEvent = (event: AgentRunEvent) => {
      if (!isCurrentRun()) {
        return;
      }

      setRunId(event.runId);
      setTransport("ndjson-v1");

      if (event.type === "run.started") {
        setProgressSteps([startedStep(event)]);
      } else if (event.type === "step.completed") {
        setProgressSteps((currentSteps) => [...currentSteps, traceStep(event)]);
      } else if (event.type === "run.completed") {
        const terminalEvent = event as AgentRunCompletedEvent;
        setAgentRun(terminalEvent.run);
        setRunStatus(statusFromRun(terminalEvent.run));
        setIsRunning(false);
        setMessage(completionMessage(terminalEvent.run));
      } else {
        setAgentRun(undefined);
        setRunStatus("failed");
        setIsRunning(false);
        setProgressSteps((currentSteps) => [...currentSteps, failureStep("The server returned a safe failure response.")]);
        setMessage("The server could not complete this run. Retry the same question.");
      }
    };

    try {
      await streamAgentRun(input, topic.id, { signal: controller.signal, onEvent });
    } catch (error) {
      if (!isCurrentRun()) {
        return;
      }

      setIsRunning(false);
      setAgentRun(undefined);
      if (error instanceof AgentClientError && error.code === "ABORTED") {
        setRunStatus("cancelled");
        setMessage("Client stopped receiving events. A synchronous server computation may have continued; retry to run again.");
      } else {
        setRunStatus("failed");
        setProgressSteps((currentSteps) => [...currentSteps, failureStep("The server response was not available.")]);
        setMessage("The run failed before completion. Retry the same question.");
      }
    } finally {
      if (isCurrentRun()) {
        abortControllerRef.current = null;
      }
    }
  }

  function handleSkills() {
    setMessage(
      "Reusable Skills are represented in the topic layer. The deterministic runner now uses versioned SQL templates and public metric metadata."
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
                abortControllerRef.current?.abort();
                runSequence.current += 1;
                clearOutput();
                setRunInput("");
              }}
              questions={topic.sampleQuestions}
              selectedQuestion={selectedQuestion}
              supportedLabel={supportedLabel(topic.id)}
            />

            <ChatComposer
              canRun={topic.id !== "knowledge-base-demo"}
              isRunning={isRunning}
              message={message}
              onChange={(value) => {
                setSelectedQuestion(value);
                setMessage("");
                abortControllerRef.current?.abort();
                runSequence.current += 1;
                clearOutput();
                setRunInput("");
              }}
              onCancel={cancelCurrentRun}
              onSkills={handleSkills}
              onRun={handleRun}
              showRetry={runStatus === "failed" || runStatus === "cancelled"}
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
                output={agentRun?.finalAnswer}
                runId={runId}
                status={runStatus}
                steps={progressSteps}
                transport={transport}
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
              Retail Growth Demo and Experiment Metrics Demo execute deterministic SQL through the agent API/serverless function.
              Knowledge Base Demo remains metadata-only in this stage.
            </EmptyState>
          </>
        ) : null}
      </div>

      <aside className="topic-right-rail">
        <RightContents items={contents} />
        <TopicHealthCard topic={topic} />
        <EmptyState title="Execution Coverage">
          Retail Growth Demo and Experiment Metrics Demo execute deterministic SQL through the agent API/serverless function.
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
