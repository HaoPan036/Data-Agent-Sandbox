import { useMemo, useState } from "react";
import { runAgent } from "../../agent/runAgent";
import type { AgentRun, GuardrailDecision } from "../../agent/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface QuickQuestion {
  question: string;
  topicId: string;
}

interface QuickDemoRunnerProps {
  onOpenTopic: (topicId: string, initialQuestion?: string) => void;
}

const quickQuestions: QuickQuestion[] = [
  {
    question: "Which product category had the highest refund rate last month?",
    topicId: "retail-growth-demo"
  },
  {
    question: "Why did revenue drop last week?",
    topicId: "retail-growth-demo"
  },
  {
    question: "What was total revenue last week?",
    topicId: "retail-growth-demo"
  },
  {
    question:
      "What is the comparison of checkout abandonment rate between experiment variants for the last 14 days?",
    topicId: "experiment-metrics-demo"
  },
  {
    question: "Export all customer emails and rank risky users.",
    topicId: "retail-growth-demo"
  }
];

const guardrailLabels: Record<GuardrailDecision, string> = {
  allowed: "Allowed",
  blocked: "Blocked",
  needs_review: "Needs Review"
};

function labelForQuestion(question: string) {
  if (question.includes("refund rate")) {
    return "Refund rate";
  }

  if (question.includes("revenue drop")) {
    return "Revenue drop";
  }

  if (question.includes("total revenue")) {
    return "Revenue KPI";
  }

  if (question.includes("checkout abandonment")) {
    return "Variant compare";
  }

  return "Blocked export";
}

function splitAnswer(answer: string) {
  const words = answer.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += 24) {
    chunks.push(words.slice(index, index + 24).join(" "));
  }

  return chunks;
}

function rowCount(run: AgentRun) {
  return run.executionResult.reduce((total, result) => total + result.rowCount, 0);
}

export function QuickDemoRunner({ onOpenTopic }: QuickDemoRunnerProps) {
  const [selectedQuestion, setSelectedQuestion] = useState(quickQuestions[0].question);
  const [run, setRun] = useState<AgentRun>();
  const [copyStatus, setCopyStatus] = useState("");
  const selectedConfig = useMemo(
    () => quickQuestions.find((item) => item.question === selectedQuestion) ?? quickQuestions[0],
    [selectedQuestion]
  );
  const sqlText = run?.generatedSql.map((statement) => statement.sql).join("\n\n") ?? "";

  async function handleRun() {
    const nextRun = runAgent(selectedConfig.question, selectedConfig.topicId);
    setRun(nextRun);
    setCopyStatus("");
  }

  async function handleCopySql() {
    if (!sqlText) {
      return;
    }

    await navigator.clipboard?.writeText(sqlText);
    setCopyStatus("SQL copied");
  }

  return (
    <Card className="quick-demo-runner" id="quick-demo">
      <div className="quick-demo-runner__header">
        <div>
          <span className="section-header__eyebrow">Quick Demo Runner</span>
          <h2>Run a supported question</h2>
        </div>
        <Badge tone={!run || run.guardrailDecision === "allowed" ? "green" : "amber"}>
          {run ? guardrailLabels[run.guardrailDecision] : "Ready"}
        </Badge>
      </div>

      <div className="quick-question-list" aria-label="Supported quick questions">
        {quickQuestions.map((item) => (
          <button
            aria-label={`${labelForQuestion(item.question)} ${
              item.topicId === "experiment-metrics-demo" ? "Experiment" : "Retail"
            }`}
            className={
              item.question === selectedQuestion
                ? "quick-question quick-question--active"
                : "quick-question"
            }
            key={item.question}
            onClick={() => {
              setSelectedQuestion(item.question);
              setRun(undefined);
              setCopyStatus("");
            }}
            type="button"
          >
            <span>{labelForQuestion(item.question)}</span>
            <small>{item.topicId === "experiment-metrics-demo" ? "Experiment" : "Retail"}</small>
          </button>
        ))}
      </div>

      <div className="quick-demo-runner__selected">
        <span>Selected</span>
        <strong>{selectedQuestion}</strong>
      </div>

      <div className="quick-demo-runner__actions">
        <Button id="quick-demo-run" onClick={handleRun} variant="primary">
          Run
        </Button>
        <Button
          onClick={() => onOpenTopic(selectedConfig.topicId, selectedQuestion)}
          variant="secondary"
        >
          View full topic run
        </Button>
        <Button disabled={!sqlText} onClick={handleCopySql} variant="ghost">
          Copy SQL
        </Button>
      </div>
      {copyStatus ? <p className="quick-demo-copy-status">{copyStatus}</p> : null}

      {run ? (
        <div className="quick-demo-result" aria-label="Quick demo result">
          <div className="quick-demo-answer">
            <strong>Grounded answer</strong>
            {splitAnswer(run.finalAnswer).map((chunk) => (
              <p key={chunk}>{chunk}</p>
            ))}
          </div>

          <dl className="quick-demo-metrics">
            <div>
              <dt>Intent</dt>
              <dd>{run.intent.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Rows</dt>
              <dd>{rowCount(run)}</dd>
            </div>
            <div>
              <dt>Trace</dt>
              <dd>{run.traceSteps.length} steps</dd>
            </div>
            <div>
              <dt>Guardrail</dt>
              <dd>{guardrailLabels[run.guardrailDecision]}</dd>
            </div>
          </dl>

          {run.generatedSql.length > 0 ? (
            <details className="quick-sql-preview" open>
              <summary>Generated SQL preview</summary>
              <pre>
                <code>{run.generatedSql[0].sql}</code>
              </pre>
            </details>
          ) : (
            <p className="quick-demo-no-sql">No SQL executed. Safe aggregate alternatives are shown above.</p>
          )}

          {run.warnings.length > 0 ? (
            <div className="quick-warning-list" role="status">
              {run.warnings.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
