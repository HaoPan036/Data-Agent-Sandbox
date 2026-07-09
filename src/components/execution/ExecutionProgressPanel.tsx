import { Badge } from "../ui/Badge";

export type ExecutionProgressStatus = "running" | "completed" | "warning" | "blocked" | "failed";

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
  steps: ExecutionProgressStep[];
}

function badgeTone(status: ExecutionProgressStatus) {
  if (status === "completed") {
    return "green";
  }

  if (status === "blocked" || status === "failed" || status === "warning") {
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

export function ExecutionProgressPanel({ input, isRunning, steps }: ExecutionProgressPanelProps) {
  return (
    <section className="execution-progress-panel" aria-label="Live execution process">
      <div className="execution-progress-panel__header">
        <div>
          <span className="section-header__eyebrow">Live Run</span>
          <h2>Execution Process</h2>
        </div>
        <Badge tone={isRunning ? "blue" : "green"}>{isRunning ? "Running" : "Completed"}</Badge>
      </div>

      <div className="execution-io-grid">
        <div>
          <span>Input</span>
          <p>{input}</p>
        </div>
        <div>
          <span>Output</span>
          <p>{steps.at(-1)?.status === "completed" || steps.at(-1)?.status === "blocked" ? steps.at(-1)?.detail : "Waiting for agent output..."}</p>
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
