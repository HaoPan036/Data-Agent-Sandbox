import type { AgentTraceStep } from "../../agent/types";

interface TraceTimelineProps {
  steps: AgentTraceStep[];
}

export function TraceTimeline({ steps }: TraceTimelineProps) {
  return (
    <section className="execution-section">
      <h3>Trace Timeline</h3>
      <ol className="agent-trace-list">
        {steps.map((step) => (
          <li className={`agent-trace-list__item agent-trace-list__item--${step.status}`} key={step.id}>
            <span className="agent-trace-list__id">{step.id}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.message}</p>
              <small>{new Date(step.timestamp).toLocaleTimeString()}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
