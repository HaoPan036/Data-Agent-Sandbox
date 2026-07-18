import { randomUUID } from "node:crypto";
import { runAgent } from "../src/agent/runAgent.js";
import {
  AGENT_RUN_EVENT_VERSION,
  type AgentRunEvent,
  type AgentRunCompletedEvent,
  type AgentRunFailedEvent,
  type AgentRunOptions
} from "../src/agent/types.js";
import { parseRunRequest, type RunRequest } from "./_runRequest.js";

const encoder = new TextEncoder();
const NDJSON_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";
const SAFE_AGENT_FAILURE = {
  name: "AgentError",
  message: "The agent run could not be completed."
};
export const SAFE_SQL_EXECUTION_FAILURE = "SQL execution failed.";

function jsonError(status: 400 | 413 | 415, code: string, message: string) {
  return new Response(JSON.stringify({ code, message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function createRunId() {
  return `run-${randomUUID()}`;
}

function sanitizeFailedEvent(event: AgentRunFailedEvent): AgentRunFailedEvent {
  return {
    ...event,
    error: SAFE_AGENT_FAILURE
  };
}

export function sanitizeCompletedEvent(event: AgentRunCompletedEvent): AgentRunCompletedEvent {
  const hasExecutionError = event.run.executionResult.some((result) => result.error !== undefined);

  return {
    ...event,
    run: {
      ...event.run,
      finalAnswer: hasExecutionError ? SAFE_SQL_EXECUTION_FAILURE : event.run.finalAnswer,
      executionResult: event.run.executionResult.map((result) =>
        result.error === undefined
          ? result
          : { ...result, error: SAFE_SQL_EXECUTION_FAILURE }
      )
    }
  };
}

export function sanitizeAgentRunEvent(event: AgentRunEvent): AgentRunEvent {
  if (event.type === "run.failed") {
    return sanitizeFailedEvent(event);
  }

  if (event.type === "run.completed") {
    return sanitizeCompletedEvent(event);
  }

  return event;
}

function createFallbackFailedEvent(runId: string, sequence: number, startedAtMs: number): AgentRunFailedEvent {
  const timestampMs = Date.now();

  return {
    version: AGENT_RUN_EVENT_VERSION,
    runId,
    sequence,
    type: "run.failed",
    timestamp: new Date(timestampMs).toISOString(),
    elapsedMs: Math.max(0, timestampMs - startedAtMs),
    durationMs: Math.max(0, timestampMs - startedAtMs),
    error: SAFE_AGENT_FAILURE
  };
}

export type AgentRunner = (
  question: string,
  topicId: string,
  options?: AgentRunOptions
) => ReturnType<typeof runAgent>;

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === "object" && value !== null || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function streamRun(
  request: RunRequest,
  runId: string,
  signal: AbortSignal,
  runner: AgentRunner = runAgent
) {
  const startedAtMs = Date.now();
  let closed = false;
  let started = false;
  let terminalEmitted = false;
  let nextSequence = 1;
  let removeAbortListener = () => {};

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (started || closed) {
        return;
      }

      started = true;

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;

        try {
          controller.close();
        } catch {
          // The client may have cancelled the stream while the core was finishing.
        }
      };

      const stopListening = () => signal.removeEventListener("abort", onAbort);
      const onAbort = () => {
        close();
        stopListening();
      };
      removeAbortListener = stopListening;

      const enqueue = (event: AgentRunEvent) => {
        if (closed || signal.aborted || terminalEmitted) {
          return;
        }

        nextSequence = Math.max(nextSequence, event.sequence + 1);

        const safeEvent = sanitizeAgentRunEvent(event);

        if (event.type === "run.completed" || event.type === "run.failed") {
          terminalEmitted = true;
        }

        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(safeEvent)}\n`));
        } catch {
          closed = true;
          stopListening();
        }
      };

      signal.addEventListener("abort", onAbort, { once: true });

      if (signal.aborted) {
        onAbort();
        return;
      }

      try {
        const runnerResult: unknown = runner(request.question, request.topicId, {
          runId,
          onEvent: enqueue
        });

        if (isPromiseLike(runnerResult)) {
          // AgentRunner is intentionally synchronous. Handle a bad async result so
          // a rejected promise cannot become an unhandled rejection.
          void Promise.resolve(runnerResult).then(
            () => undefined,
            () => undefined
          );
          enqueue(createFallbackFailedEvent(runId, nextSequence, startedAtMs));
        } else if (!terminalEmitted) {
          enqueue(createFallbackFailedEvent(runId, nextSequence, startedAtMs));
        }
      } catch {
        if (!terminalEmitted) {
          enqueue(createFallbackFailedEvent(runId, nextSequence, startedAtMs));
        }
      } finally {
        stopListening();
        close();
      }
    },
    cancel() {
      closed = true;
      removeAbortListener();
    }
  }, { highWaterMark: 0 });

  return stream;
}

export async function handleRunRequest(
  request: Request,
  runner: AgentRunner = runAgent
): Promise<Response> {
  const parsedRequest = await parseRunRequest(request);

  if (!parsedRequest.ok) {
    return jsonError(parsedRequest.status, parsedRequest.code, parsedRequest.message);
  }

  const runId = createRunId();
  const stream = streamRun(parsedRequest.value, runId, request.signal, runner);

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": NDJSON_CONTENT_TYPE,
      "Cache-Control": "no-store",
      "X-Agent-Transport": "ndjson-v1",
      "X-Run-Id": runId
    }
  });
}

export async function POST(request: Request): Promise<Response> {
  return handleRunRequest(request);
}
