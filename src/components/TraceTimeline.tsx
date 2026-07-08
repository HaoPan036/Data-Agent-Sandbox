import type { AgentTrace } from "../agent/types";

interface TraceTimelineProps {
  trace: AgentTrace;
}

export function TraceTimeline({ trace }: TraceTimelineProps) {
  return (
    <ol className="trace-list">
      {trace.events.map((event) => (
        <li key={event.id}>
          <span className="trace-list__id">{event.id}</span>
          <div>
            <strong>{event.label}</strong>
            <p>{event.detail}</p>
            <small>{event.elapsedMs}ms</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

