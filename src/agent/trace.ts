import type {
  AgentTrace,
  AgentTraceEvent,
  AgentTraceStep,
  AgentTraceStepStatus,
  QueryValue
} from "./types";

function nowIso() {
  return new Date().toISOString();
}

function elapsedSince(startedAt: string) {
  return Date.now() - new Date(startedAt).getTime();
}

export function createTrace(question: string): AgentTrace {
  return {
    question,
    startedAt: nowIso(),
    events: []
  };
}

export function appendTraceEvent(
  trace: AgentTrace,
  label: string,
  detail: string,
  metadata?: Record<string, QueryValue | QueryValue[]>
): AgentTrace {
  const event: AgentTraceEvent = {
    id: `${trace.events.length + 1}`.padStart(2, "0"),
    label,
    detail,
    timestamp: nowIso(),
    elapsedMs: elapsedSince(trace.startedAt),
    metadata
  };

  return {
    ...trace,
    events: [...trace.events, event]
  };
}

export function completeTrace(trace: AgentTrace): AgentTrace {
  const completedAt = nowIso();

  return {
    ...trace,
    completedAt,
    totalElapsedMs: new Date(completedAt).getTime() - new Date(trace.startedAt).getTime()
  };
}

export function createTraceStep(
  index: number,
  label: string,
  status: AgentTraceStepStatus,
  message: string,
  details?: AgentTraceStep["details"],
  timestamp = nowIso()
): AgentTraceStep {
  return {
    id: `${index}`.padStart(2, "0"),
    label,
    status,
    message,
    details,
    timestamp
  };
}
