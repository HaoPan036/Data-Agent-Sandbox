import { Badge } from "../ui/Badge";

export type ExecutionProgressStatus =
  | "running"
  | "completed"
  | "warning"
  | "blocked"
  | "failed"
  | "cancelled";

export interface ExecutionProgressStep {
  id: string;
  label: string;
  status: ExecutionProgressStatus;
  detail: string;
  artifact?: string;
}

interface ExecutionProgressPanelProps {
  input: string;
  isRunning: boolean;
  output?: string;
  runId?: string;
  status?: ExecutionProgressStatus;
  steps: ExecutionProgressStep[];
  transport?: string;
}

function badgeTone(status: ExecutionProgressStatus) {
  if (status === "completed") {
    return "green";
  }

  if (status === "blocked" || status === "failed" || status === "warning" || status === "cancelled") {
    return "amber";
  }

  return "blue";
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function ExecutionProgressPanel({
  input,
  isRunning,
  output,
  runId,
  status,
  steps,
  transport
}: ExecutionProgressPanelProps) {
  const currentStatus = status ?? (isRunning ? "running" : "completed");
  const safeOutput = output?.trim() ? output : undefined;
  const terminalOutput =
    currentStatus === "cancelled"
      ? "Client stopped receiving events. A synchronous server computation may have continued; retry to run again."
      : currentStatus === "failed"
        ? safeOutput ?? "No terminal result is available because the server run failed. Retry to request a fresh result."
        : safeOutput ?? (isRunning ? "Waiting for server output..." : steps.at(-1)?.detail ?? "No output available.");

  return (
    <section aria-label="Live execution process" aria-live="polite" className="execution-progress-panel">
      <div className="execution-progress-panel__header">
        <div>
          <span className="section-header__eyebrow">Live Run</span>
          <h2>Execution Process</h2>
        </div>
        <Badge tone={badgeTone(currentStatus)}>{titleCase(currentStatus)}</Badge>
      </div>

      {runId || transport ? (
        <div className="execution-run-meta" aria-label="Server run metadata">
          {runId ? <span>Run ID: {runId}</span> : null}
          {transport ? <span>Transport: {transport}</span> : null}
        </div>
      ) : null}

      <div className="execution-io-grid">
        <div>
          <span>Input</span>
          <p>{input}</p>
        </div>
        <div>
          <span>Output</span>
          <p>{terminalOutput}</p>
        </div>
      </div>

      <ol className="execution-progress-steps">
        {steps.map((step, index) => (
          <li className={`execution-progress-step execution-progress-step--${step.status}`} key={step.id}>
            <span className="execution-progress-step__index">{index + 1}</span>
            <div className="execution-progress-step__body">
              <div className="execution-progress-step__top">
                <h3>{step.label}</h3>
                <Badge tone={badgeTone(step.status)}>{titleCase(step.status)}</Badge>
              </div>
              <p>{step.detail}</p>
              {step.artifact ? (
                <pre>
                  <code>{step.artifact}</code>
                </pre>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
