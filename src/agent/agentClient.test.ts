import { describe, expect, it, vi } from "vitest";
import { runAgent } from "./runAgent";
import {
  AGENT_RESPONSE_LIMITS,
  streamAgentRun,
  type AgentClientErrorCode
} from "./agentClient";
import type { AgentRun, AgentRunEvent } from "./types";

const JSON_HEADERS = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "X-Agent-Transport": "ndjson-v1",
  "X-Run-Id": "run-client-test"
};

function responseFor(
  events: unknown[],
  options: { trailingNewline?: boolean; chunks?: Uint8Array[]; headers?: Record<string, string> } = {}
) {
  const encoded = new TextEncoder().encode(
    events.map((event) => JSON.stringify(event)).join("\n") + (options.trailingNewline === false ? "" : "\n")
  );
  const chunks = options.chunks ?? [encoded];
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[index]);
      index += 1;
    }
  });

  return new Response(body, { status: 200, headers: { ...JSON_HEADERS, ...options.headers } });
}

async function realEvents(question = "What was total revenue last week?") {
  const events: AgentRunEvent[] = [];
  runAgent(question, "retail-growth-demo", { runId: "run-client-test", onEvent: (event) => events.push(event) });
  return events;
}

function fetchReturning(response: Response) {
  return vi.fn<typeof fetch>().mockResolvedValue(response);
}

function responseWithCancelSpy(
  init: ResponseInit,
  headers: Record<string, string> = JSON_HEADERS
) {
  const cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>({ cancel });
  return {
    cancel,
    response: new Response(body, { ...init, headers: { ...headers, ...init.headers } })
  };
}

async function expectClientError(promise: Promise<unknown>, code: AgentClientErrorCode, status?: number) {
  await expect(promise).rejects.toMatchObject({ code, ...(status === undefined ? {} : { status }) });
}

describe("streamAgentRun", () => {
  it("posts the request and parses real events across split UTF-8 and chunk boundaries", async () => {
    const events = await realEvents("请显示上周收入趋势");
    const payload = new TextEncoder().encode(events.map((event) => JSON.stringify(event)).join("\n"));
    const chunks = Array.from({ length: payload.length }, (_, index) => payload.slice(index, index + 1));
    const fetchImpl = fetchReturning(responseFor(events, { trailingNewline: false, chunks }));
    const seen: string[] = [];

    const terminal = await streamAgentRun("请显示上周收入趋势", "retail-growth-demo", {
      fetchImpl,
      onEvent: async (event) => {
        seen.push(event.type);
        await Promise.resolve();
      }
    });

    expect(terminal.type).toBe("run.completed");
    expect(seen).toEqual(events.map((event) => event.type));
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/runs",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ question: "请显示上周收入趋势", topicId: "retail-growth-demo" })
      })
    );
  });

  it("handles multiple events in one chunk and a final line without a newline", async () => {
    const events = await realEvents();
    const fetchImpl = fetchReturning(responseFor(events, { trailingNewline: false }));
    const terminal = await streamAgentRun("What was total revenue last week?", "retail-growth-demo", { fetchImpl });
    expect(terminal.type).toBe("run.completed");
  });

  it("awaits callbacks in event order", async () => {
    const events = await realEvents();
    const seen: string[] = [];
    const fetchImpl = fetchReturning(responseFor(events));
    await streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
      fetchImpl,
      onEvent: async (event) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        seen.push(event.type);
      }
    });
    expect(seen).toEqual(events.map((event) => event.type));
  });

  it("withholds the completion callback until valid EOF and preserves callback order", async () => {
    const events = await realEvents();
    const seen: AgentRunEvent[] = [];

    const terminal = await streamAgentRun(
      "What was total revenue last week?",
      "retail-growth-demo",
      {
        fetchImpl: fetchReturning(responseFor(events)),
        onEvent: (event) => {
          seen.push(event);
        }
      }
    );

    expect(terminal).toEqual(events.at(-1));
    expect(seen).toEqual(events);
    expect(seen.filter((event) => event.type === "run.completed")).toHaveLength(1);
    expect(seen.at(-1)).toBe(terminal);
  });

  it("accepts a completion trace that exactly matches streamed steps in order", async () => {
    const events = await realEvents();
    const seen: AgentRunEvent[] = [];
    const terminal = await streamAgentRun(
      "What was total revenue last week?",
      "retail-growth-demo",
      {
        fetchImpl: fetchReturning(responseFor(events)),
        onEvent: (event) => {
          seen.push(event);
        }
      }
    );

    expect(terminal.type).toBe("run.completed");
    if (terminal.type === "run.completed") {
      expect(
        seen
          .filter((event) => event.type === "step.completed")
          .map((event) => event.step)
      ).toEqual(terminal.run.traceSteps);
    }
  });

  it("isolates trace validation from callback mutations", async () => {
    const events = await realEvents();
    const completion = events.at(-1) as Extract<AgentRunEvent, { type: "run.completed" }>;
    let mutatedMessage = false;
    let mutatedDetailsArray = false;

    const terminal = await streamAgentRun(
      "What was total revenue last week?",
      "retail-growth-demo",
      {
        fetchImpl: fetchReturning(responseFor(events)),
        onEvent: (event) => {
          if (event.type !== "step.completed") {
            return;
          }

          if (!mutatedMessage) {
            event.step.message = "Changed by the event consumer.";
            mutatedMessage = true;
          }

          if (!mutatedDetailsArray) {
            const arrayDetail = Object.values(event.step.details ?? {}).find(Array.isArray);

            if (arrayDetail) {
              (arrayDetail as unknown[]).push("changed-by-consumer");
              mutatedDetailsArray = true;
            }
          }
        }
      }
    );

    expect(mutatedMessage).toBe(true);
    expect(mutatedDetailsArray).toBe(true);
    expect(terminal).toEqual(completion);
  });

  it("rejects missing, reordered, altered, or extra terminal trace steps", async () => {
    const events = await realEvents();
    const completion = events.at(-1) as Extract<AgentRunEvent, { type: "run.completed" }>;
    const traceSteps = completion.run.traceSteps;
    const firstStep = traceSteps[0];

    if (!firstStep || traceSteps.length < 2) {
      throw new Error("Expected multiple trace steps from the real agent run.");
    }

    const mismatches = [
      traceSteps.slice(1),
      [traceSteps[1], traceSteps[0], ...traceSteps.slice(2)],
      [{ ...firstStep, message: `${firstStep.message} altered` }, ...traceSteps.slice(1)],
      [...traceSteps, { ...firstStep, id: "trace-extra" }]
    ];

    for (const candidateTrace of mismatches) {
      const seen: AgentRunEvent[] = [];
      const candidate = {
        ...completion,
        run: { ...completion.run, traceSteps: candidateTrace }
      };

      await expectClientError(
        streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
          fetchImpl: fetchReturning(responseFor([...events.slice(0, -1), candidate])),
          onEvent: (event) => {
            seen.push(event);
          }
        }),
        "INVALID_RESPONSE"
      );

      expect(seen.some((event) => event.type === "run.completed")).toBe(false);
    }
  });

  it("never delivers a completion callback when data follows the terminal event", async () => {
    const events = await realEvents();
    const trailingEvent = { ...events[0], sequence: events.length + 1 };
    const seen: AgentRunEvent[] = [];

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor([...events, trailingEvent])),
        onEvent: (event) => {
          seen.push(event);
        }
      }),
      "EVENT_ORDER"
    );

    expect(seen.map((event) => event.type)).toEqual(
      events.slice(0, -1).map((event) => event.type)
    );
    expect(seen.some((event) => event.type === "run.completed")).toBe(false);
  });

  it("returns run.failed as a valid terminal event", async () => {
    const failed = {
      version: 1,
      runId: "run-client-test",
      sequence: 2,
      type: "run.failed",
      timestamp: new Date().toISOString(),
      elapsedMs: 2,
      durationMs: 2,
      error: { name: "AgentError", message: "The agent run could not be completed." }
    } satisfies AgentRunEvent;
    const started = {
      version: 1,
      runId: "run-client-test",
      sequence: 1,
      type: "run.started",
      timestamp: new Date().toISOString(),
      elapsedMs: 0,
      durationMs: 0,
      question: "test",
      topicId: "retail-growth-demo"
    } satisfies AgentRunEvent;

    const terminal = await streamAgentRun("test", "retail-growth-demo", {
      fetchImpl: fetchReturning(responseFor([started, failed]))
    });
    expect(terminal).toEqual(failed);
  });

  it("rejects malformed JSON and unknown events", async () => {
    const malformedResponse = new Response(new TextEncoder().encode("{bad\n"), {
      status: 200,
      headers: JSON_HEADERS
    });
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", { fetchImpl: fetchReturning(malformedResponse) }),
      "INVALID_EVENT"
    );

    const events = await realEvents();
    const unknown = { ...events[0], type: "run.unknown" };
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", { fetchImpl: fetchReturning(responseFor([unknown])) }),
      "INVALID_EVENT"
    );
  });

  it("rejects malformed chart specs before they reach consumers", async () => {
    const events = await realEvents();
    const completion = events.at(-1);
    expect(completion?.type).toBe("run.completed");
    const completedRun = (completion as Extract<AgentRunEvent, { type: "run.completed" }>).run;
    const chartSpec = completedRun.chartSpec;
    expect(chartSpec).toBeDefined();

    const malformedSpecs: Record<string, unknown>[] = [
      { ...chartSpec, type: "pie" },
      { ...chartSpec, title: 42 },
      { ...chartSpec, xKey: 42 },
      { ...chartSpec, yKeys: ["revenue", 42] },
      { ...chartSpec, yKeys: Array(AGENT_RESPONSE_LIMITS.maxArrayItems + 1).fill("revenue") },
      { ...chartSpec, seriesKey: 42 },
      { ...chartSpec, data: [{ revenue: { nested: true } }] },
      { ...chartSpec, data: Array(AGENT_RESPONSE_LIMITS.maxRows + 1).fill({}) }
    ];

    for (const malformedChartSpec of malformedSpecs) {
      const malformed = {
        ...completion,
        run: { ...completedRun, chartSpec: malformedChartSpec }
      };
      await expectClientError(
        streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
          fetchImpl: fetchReturning(responseFor([...events.slice(0, -1), malformed]))
        }),
        "INVALID_EVENT"
      );
    }
  });

  it("rejects empty SQL and inconsistent execution-result metadata", async () => {
    const events = await realEvents();
    const completion = events.at(-1);
    expect(completion?.type).toBe("run.completed");
    const run = (completion as Extract<AgentRunEvent, { type: "run.completed" }>).run;
    const result = run.executionResult[0];

    if (!result) {
      throw new Error("Expected an execution result fixture.");
    }

    const candidates: AgentRun[] = [
      {
        ...run,
        generatedSql: [{ ...run.generatedSql[0], sql: "   " }]
      },
      {
        ...run,
        executionResult: [{ ...result, rowCount: result.rows.length + 1 }]
      },
      {
        ...run,
        executionResult: [{ ...result, isEmpty: result.rows.length > 0 }]
      }
    ];

    for (const candidate of candidates) {
      const invalidCompletion = { ...completion, run: candidate };
      await expectClientError(
        streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
          fetchImpl: fetchReturning(responseFor([...events.slice(0, -1), invalidCompletion]))
        }),
        "INVALID_EVENT"
      );
    }
  });

  it("rejects incomplete successful allowed outcomes", async () => {
    const events = await realEvents();
    const completion = events.at(-1);
    expect(completion?.type).toBe("run.completed");
    const run = (completion as Extract<AgentRunEvent, { type: "run.completed" }>).run;
    const candidates: AgentRun[] = [
      { ...run, validationResults: [] },
      { ...run, executionResult: [] },
      { ...run, chartSpec: undefined }
    ];

    for (const candidate of candidates) {
      const invalidCompletion = { ...completion, run: candidate };
      await expectClientError(
        streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
          fetchImpl: fetchReturning(responseFor([...events.slice(0, -1), invalidCompletion]))
        }),
        "INVALID_EVENT"
      );
    }
  });

  it("accepts legitimate blocked, no-SQL needs-review, and partial failed outcomes", async () => {
    const blockedQuestion = "Export all customer emails and rank risky users.";
    const blockedEvents = await realEvents(blockedQuestion);
    const blockedTerminal = await streamAgentRun(blockedQuestion, "retail-growth-demo", {
      fetchImpl: fetchReturning(responseFor(blockedEvents))
    });
    expect(blockedTerminal.type).toBe("run.completed");
    if (blockedTerminal.type === "run.completed") {
      expect(blockedTerminal.run.status).toBe("blocked");
    }

    const reviewQuestion = "Tell me a joke.";
    const reviewEvents = await realEvents(reviewQuestion);
    const reviewTerminal = await streamAgentRun(reviewQuestion, "retail-growth-demo", {
      fetchImpl: fetchReturning(responseFor(reviewEvents))
    });
    expect(reviewTerminal.type).toBe("run.completed");
    if (reviewTerminal.type === "run.completed") {
      expect(reviewTerminal.run.guardrailDecision).toBe("needs_review");
      expect(reviewTerminal.run.generatedSql).toHaveLength(0);
    }

    const failedEvents = await realEvents();
    const failedCompletion = failedEvents.at(-1);
    expect(failedCompletion?.type).toBe("run.completed");
    const completedRun = (failedCompletion as Extract<AgentRunEvent, { type: "run.completed" }>).run;
    const validation = completedRun.validationResults[0];
    if (!validation) {
      throw new Error("Expected a validation fixture.");
    }
    const failedRun: AgentRun = {
      ...completedRun,
      chartSpec: undefined,
      executionResult: [],
      finalAnswer: "SQL validation stopped execution. Review the validation details.",
      guardrailDecision: "needs_review",
      status: "failed",
      validationResults: [{ ...validation, passed: false, severity: "error" }]
    };
    const failedTerminal = await streamAgentRun(
      "What was total revenue last week?",
      "retail-growth-demo",
      {
        fetchImpl: fetchReturning(
          responseFor([...failedEvents.slice(0, -1), { ...failedCompletion, run: failedRun }])
        )
      }
    );
    expect(failedTerminal.type).toBe("run.completed");
    if (failedTerminal.type === "run.completed") {
      expect(failedTerminal.run.status).toBe("failed");
      expect(failedTerminal.run.finalAnswer).toContain("validation stopped execution");
    }
  });

  it("rejects sequence, first-event, runId, and terminal ordering violations", async () => {
    const events = await realEvents();
    const cases: AgentRunEvent[][] = [
      [{ ...events[0], sequence: 2 }, ...events.slice(1)],
      [...events.slice(1)],
      [events[0], { ...events[1], runId: "run-other" }, ...events.slice(2)],
      [events[0], ...events.slice(1, -1), events.at(-1)!, events.at(-1)!]
    ];

    for (const candidate of cases) {
      await expectClientError(
        streamAgentRun("test", "retail-growth-demo", { fetchImpl: fetchReturning(responseFor(candidate)) }),
        candidate[0]?.type === "run.started" && candidate.at(-1)?.type === "run.completed" && candidate.length !== events.length
          ? "EVENT_ORDER"
          : "EVENT_ORDER"
      );
    }
  });

  it("rejects duplicate run.started events and nonterminal completion statuses", async () => {
    const events = await realEvents();
    const duplicateStart = { ...events[0], sequence: 2 };

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor([events[0], duplicateStart]))
      }),
      "EVENT_ORDER"
    );

    const completion = events.at(-1) as Extract<AgentRunEvent, { type: "run.completed" }>;
    for (const status of ["idle", "running"] as const) {
      const invalidCompletion = {
        ...completion,
        run: { ...completion.run, status }
      };

      await expectClientError(
        streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
          fetchImpl: fetchReturning(responseFor([...events.slice(0, -1), invalidCompletion]))
        }),
        "INVALID_EVENT"
      );
    }
  });

  it("binds the stream to the response header and requested question/topic", async () => {
    const events = await realEvents();

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor(events, { headers: { "X-Run-Id": "" } }))
      }),
      "INVALID_RESPONSE"
    );

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor(events, { headers: { "X-Run-Id": "run-other" } }))
      }),
      "EVENT_ORDER"
    );

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(
          responseFor([{ ...events[0], question: "different question" }, ...events.slice(1)])
        )
      }),
      "EVENT_ORDER"
    );

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor([{ ...events[0], topicId: "other-topic" }, ...events.slice(1)]))
      }),
      "EVENT_ORDER"
    );
  });

  it("binds completion identity to the requested run", async () => {
    const events = await realEvents();
    const completion = events.at(-1) as Extract<AgentRunEvent, { type: "run.completed" }>;

    for (const runPatch of [
      { userQuestion: "different question" },
      { topicId: "other-topic" },
      { runId: "run-other" }
    ]) {
      const candidate = {
        ...completion,
        run: { ...completion.run, ...runPatch }
      };
      await expectClientError(
        streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
          fetchImpl: fetchReturning(responseFor([...events.slice(0, -1), candidate]))
        }),
        "INVALID_RESPONSE"
      );
    }
  });

  it("rejects an event after a terminal event and a missing terminal", async () => {
    const events = await realEvents();
    const afterTerminal = [...events, { ...events[0], sequence: events.length + 1 }];
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", { fetchImpl: fetchReturning(responseFor(afterTerminal)) }),
      "EVENT_ORDER"
    );

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor(events.slice(0, -1)))
      }),
      "MISSING_TERMINAL"
    );
  });

  it("requires the stream response headers and body", async () => {
    const headers = new Headers(JSON_HEADERS);
    headers.delete("X-Agent-Transport");
    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(new Response("", { status: 200, headers }))
      }),
      "INVALID_RESPONSE"
    );

    const missingBody = new Response(null, { status: 200, headers: JSON_HEADERS });
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", { fetchImpl: fetchReturning(missingBody) }),
      "MISSING_STREAM"
    );
  });

  it("enforces total, line, and event count response limits", async () => {
    const events = await realEvents();
    const oversizedLine = {
      ...events.at(-1),
      run: {
        ...(events.at(-1) as Extract<AgentRunEvent, { type: "run.completed" }>).run,
        finalAnswer: "x".repeat(AGENT_RESPONSE_LIMITS.maxLineBytes)
      }
    };
    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor([...events.slice(0, -1), oversizedLine]))
      }),
      "RESPONSE_TOO_LARGE"
    );

    const oversizedResponse = new Response(new Uint8Array(AGENT_RESPONSE_LIMITS.maxTotalBytes + 1), {
      status: 200,
      headers: JSON_HEADERS
    });
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", { fetchImpl: fetchReturning(oversizedResponse) }),
      "RESPONSE_TOO_LARGE"
    );

    const step = events.find((event) => event.type === "step.completed");
    expect(step?.type).toBe("step.completed");
    const manyEvents = [
      events[0],
      ...Array.from({ length: AGENT_RESPONSE_LIMITS.maxEvents }, (_, index) => ({
        ...(step as Extract<AgentRunEvent, { type: "step.completed" }>),
        sequence: index + 2
      })),
      { ...(events.at(-1) as Extract<AgentRunEvent, { type: "run.completed" }>), sequence: AGENT_RESPONSE_LIMITS.maxEvents + 2 }
    ];
    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor(manyEvents))
      }),
      "RESPONSE_TOO_LARGE"
    );
  });

  it("uses stable HTTP errors without exposing the response body", async () => {
    const fetchImpl = fetchReturning(
      new Response("database password=secret", {
        status: 502,
        headers: { "Content-Type": "text/plain" }
      })
    );
    const promise = streamAgentRun("test", "retail-growth-demo", { fetchImpl });
    const error = await promise.catch((value: unknown) => value);
    expect(error).toMatchObject({ code: "HTTP_ERROR", status: 502 });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain("database password=secret");
  });

  it("cancels rejected response bodies before throwing stable response errors", async () => {
    const rejected = responseWithCancelSpy({ status: 502 }, { "Content-Type": "text/plain" });
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", {
        fetchImpl: fetchReturning(rejected.response)
      }),
      "HTTP_ERROR",
      502
    );
    expect(rejected.cancel).toHaveBeenCalledOnce();

    const unsupportedContentType = responseWithCancelSpy(
      { status: 200 },
      { ...JSON_HEADERS, "Content-Type": "application/json" }
    );
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", {
        fetchImpl: fetchReturning(unsupportedContentType.response)
      }),
      "INVALID_RESPONSE",
      200
    );
    expect(unsupportedContentType.cancel).toHaveBeenCalledOnce();

    const unsupportedTransport = responseWithCancelSpy(
      { status: 200 },
      { ...JSON_HEADERS, "X-Agent-Transport": "future-v2" }
    );
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", {
        fetchImpl: fetchReturning(unsupportedTransport.response)
      }),
      "INVALID_RESPONSE",
      200
    );
    expect(unsupportedTransport.cancel).toHaveBeenCalledOnce();

    const missingRunId = responseWithCancelSpy(
      { status: 200 },
      {
        "Content-Type": JSON_HEADERS["Content-Type"],
        "X-Agent-Transport": JSON_HEADERS["X-Agent-Transport"]
      }
    );
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", {
        fetchImpl: fetchReturning(missingRunId.response)
      }),
      "INVALID_RESPONSE",
      200
    );
    expect(missingRunId.cancel).toHaveBeenCalledOnce();

    const invalidRunId = responseWithCancelSpy(
      { status: 200 },
      { ...JSON_HEADERS, "X-Run-Id": "" }
    );
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", {
        fetchImpl: fetchReturning(invalidRunId.response)
      }),
      "INVALID_RESPONSE",
      200
    );
    expect(invalidRunId.cancel).toHaveBeenCalledOnce();
  });

  it("maps fetch and stream aborts to ABORTED and releases the reader", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => {
      controller.abort();
      throw new DOMException("The operation was aborted.", "AbortError");
    });
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", { fetchImpl, signal: controller.signal }),
      "ABORTED"
    );

    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>((_resolve, reject) => {
          if (streamController.signal.aborted) {
            reject(new DOMException("The operation was aborted.", "AbortError"));
            return;
          }
          streamController.signal.addEventListener(
            "abort",
            () => reject(new DOMException("The operation was aborted.", "AbortError")),
            { once: true }
          );
        });
      }
    });
    const response = new Response(stream, { status: 200, headers: JSON_HEADERS });
    const streamController = new AbortController();
    const promise = streamAgentRun("test", "retail-growth-demo", {
      fetchImpl: fetchReturning(response),
      signal: streamController.signal
    });
    streamController.abort();
    await expectClientError(promise, "ABORTED");
    expect(stream.locked).toBe(false);
  });

  it("maps network failures and callback failures to stable client errors", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error("secret network detail"));
    await expectClientError(
      streamAgentRun("test", "retail-growth-demo", { fetchImpl }),
      "HTTP_ERROR"
    );

    const events = await realEvents();
    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor(events)),
        onEvent: () => {
          throw new Error("secret callback detail");
        }
      }),
      "CALLBACK_ERROR"
    );

    await expectClientError(
      streamAgentRun("What was total revenue last week?", "retail-growth-demo", {
        fetchImpl: fetchReturning(responseFor(events)),
        onEvent: (event) => {
          if (event.type === "run.completed") {
            throw new Error("secret terminal callback detail");
          }
        }
      }),
      "CALLBACK_ERROR"
    );
  });
});
