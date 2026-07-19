import { useCallback, useEffect, useRef, useState } from "react";
import { AgentClientError, streamAgentRun } from "../../agent/agentClient";
import type { AgentRun, AgentRunEvent } from "../../agent/types";

export type StreamRunStatus = "idle" | "running" | "completed" | "blocked" | "failed" | "cancelled";

export interface StreamRunState {
  error?: string;
  events: AgentRunEvent[];
  run?: AgentRun;
  status: StreamRunStatus;
}

function safeFailureMessage(error: unknown) {
  if (error instanceof AgentClientError && error.code === "ABORTED") {
    return "Client stopped receiving events. A synchronous server computation may have continued; retry to run again.";
  }

  return "The server run did not finish. Retry to request a fresh result.";
}

export function useShowcaseRun(
  question: string,
  topicId: string,
  options: { autoStart?: boolean } = {}
) {
  const [state, setState] = useState<StreamRunState>({ events: [], status: "idle" });
  const sequenceRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const startRun = useCallback(async () => {
    controllerRef.current?.abort();
    const sequence = sequenceRef.current + 1;
    sequenceRef.current = sequence;
    const controller = new AbortController();
    controllerRef.current = controller;

    setState({ events: [], status: "running" });

    const isCurrent = () => sequence === sequenceRef.current;

    try {
      const terminal = await streamAgentRun(question, topicId, {
        signal: controller.signal,
        onEvent: (event) => {
          if (!isCurrent()) {
            return;
          }

          setState((current) => ({
            ...current,
            events: [...current.events, event],
            run:
              event.type === "run.completed"
                ? event.run
                : event.type === "run.failed"
                  ? undefined
                  : current.run,
            status:
              event.type === "run.completed"
                ? event.run.status
                : event.type === "run.failed"
                  ? "failed"
                  : "running"
          }));
        }
      });

      if (!isCurrent()) {
        return;
      }

      setState((current) => ({
        ...current,
        error: terminal.type === "run.failed" ? "The server returned a safe failure response. Retry to try again." : current.error,
        run: terminal.type === "run.completed" ? terminal.run : undefined,
        status: terminal.type === "run.completed" ? terminal.run.status : "failed"
      }));
    } catch (error) {
      if (!isCurrent()) {
        return;
      }

      setState((current) => ({
        ...current,
        error: safeFailureMessage(error),
        run: undefined,
        status: error instanceof AgentClientError && error.code === "ABORTED" ? "cancelled" : "failed"
      }));
    } finally {
      if (isCurrent()) {
        controllerRef.current = null;
      }
    }
  }, [question, topicId]);

  const cancel = useCallback(() => {
    if (!controllerRef.current) {
      return;
    }

    sequenceRef.current += 1;
    controllerRef.current.abort();
    controllerRef.current = null;
    setState((current) => ({
      ...current,
      error: safeFailureMessage(new AgentClientError("ABORTED", "Agent run was cancelled.")),
      run: undefined,
      status: "cancelled"
    }));
  }, []);

  const reset = useCallback(() => {
    sequenceRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ events: [], status: "idle" });
  }, []);

  useEffect(() => {
    let scheduledStartCancelled = false;

    if (options.autoStart !== false) {
      queueMicrotask(() => {
        if (!scheduledStartCancelled) {
          void startRun();
        }
      });
    }

    return () => {
      scheduledStartCancelled = true;
      sequenceRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [options.autoStart, startRun]);

  return {
    ...state,
    cancel,
    isRunning: state.status === "running",
    reset,
    retry: startRun
  };
}
