import type {
  AgentRun,
  AgentRunCompletedEvent,
  AgentRunEvent,
  AgentRunFailedEvent,
  AgentTraceStepStatus,
  QueryValue
} from "./types";
import { deriveRunOutcome } from "./runOutcome";

export type AgentClientErrorCode =
  | "HTTP_ERROR"
  | "INVALID_RESPONSE"
  | "INVALID_EVENT"
  | "MISSING_STREAM"
  | "ABORTED"
  | "MISSING_TERMINAL"
  | "EVENT_ORDER"
  | "RESPONSE_TOO_LARGE"
  | "CALLBACK_ERROR";

export class AgentClientError extends Error {
  readonly code: AgentClientErrorCode;
  readonly status?: number;

  constructor(code: AgentClientErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AgentClientError";
    this.code = code;
    this.status = status;
  }
}

export interface StreamAgentRunOptions {
  signal?: AbortSignal;
  onEvent?: (event: AgentRunEvent) => void | Promise<void>;
  fetchImpl?: typeof fetch;
}

const NDJSON_CONTENT_TYPE = "application/x-ndjson";
const AGENT_TRANSPORT = "ndjson-v1";
const TERMINAL_EVENT_TYPES = new Set(["run.completed", "run.failed"]);
const AGENT_RUN_STATUSES = new Set(["idle", "running", "completed", "blocked", "failed"]);
const COMPLETED_EVENT_RUN_STATUSES = new Set(["completed", "blocked", "failed"]);
const AGENT_INTENTS = new Set([
  "metric_lookup",
  "metric_comparison",
  "trend_analysis",
  "diagnostic_analysis",
  "campaign_review",
  "experiment_analysis",
  "data_completeness_check",
  "governance_sensitive_request",
  "unknown"
]);
const VALIDATION_SEVERITIES = new Set(["info", "warning", "error"]);
const GUARDRAIL_DECISIONS = new Set(["allowed", "blocked", "needs_review"]);
const TRACE_STEP_STATUSES = new Set<AgentTraceStepStatus>([
  "completed",
  "blocked",
  "failed",
  "warning"
]);
const CHART_TYPES = new Set(["kpi", "bar", "line", "table", "status"]);

export const AGENT_RESPONSE_LIMITS = {
  maxTotalBytes: 2 * 1024 * 1024,
  maxLineBytes: 1024 * 1024,
  maxEvents: 256,
  maxArrayItems: 256,
  maxRows: 10_000,
  maxRowKeys: 256,
  maxStringLength: 16_384,
  maxSqlLength: 64 * 1024,
  maxColumns: 256
} as const;

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= AGENT_RESPONSE_LIMITS.maxStringLength
  );
}

function isNonEmptyBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isBoundedString(
  value: unknown,
  maxLength: number = AGENT_RESPONSE_LIMITS.maxStringLength
): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isBoundedStringArray(value: unknown, requireNonEmpty = false): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
    (!requireNonEmpty || value.length > 0) &&
    value.every((item) => isNonEmptyString(item))
  );
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isQueryValue(value: unknown): value is QueryValue {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isQueryRow(value: unknown): value is Record<string, QueryValue> {
  return (
    isRecord(value) &&
    Object.keys(value).length <= AGENT_RESPONSE_LIMITS.maxRowKeys &&
    Object.entries(value).every(
      ([key, item]) =>
        isBoundedString(key, AGENT_RESPONSE_LIMITS.maxStringLength) &&
        (typeof item !== "string" || isBoundedString(item, AGENT_RESPONSE_LIMITS.maxStringLength)) &&
        isQueryValue(item)
    )
  );
}

function isBoundedDetailValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return (
      value.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
      value.every(
        (item) =>
          isQueryValue(item) &&
          (typeof item !== "string" || isBoundedString(item))
      )
    );
  }

  return isQueryValue(value) && (typeof value !== "string" || isBoundedString(value));
}

function isBoundedDetails(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.keys(value).length <= AGENT_RESPONSE_LIMITS.maxRowKeys &&
    Object.values(value).every(isBoundedDetailValue)
  );
}

function isTraceStep(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    typeof value.status === "string" &&
    TRACE_STEP_STATUSES.has(value.status as AgentTraceStepStatus) &&
    isBoundedString(value.message) &&
    isNonEmptyString(value.timestamp) &&
    (value.details === undefined || isBoundedDetails(value.details))
  );
}

function isChartSpec(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.type === "string" &&
    CHART_TYPES.has(value.type) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.xKey) &&
    isBoundedStringArray(value.yKeys, true) &&
    (value.seriesKey === undefined || isNonEmptyString(value.seriesKey)) &&
    Array.isArray(value.data) &&
    value.data.length <= AGENT_RESPONSE_LIMITS.maxRows &&
    value.data.every(isQueryRow)
  );
}

function isAgentRun(value: unknown): value is AgentRun {
  if (!isRecord(value)) {
    return false;
  }

  const executionResult = value.executionResult;
  const generatedSql = value.generatedSql;
  const validationResults = value.validationResults;

  const valid = (
    isNonEmptyString(value.runId) &&
    typeof value.status === "string" &&
    AGENT_RUN_STATUSES.has(value.status) &&
    isNonEmptyString(value.topicId) &&
    isBoundedString(value.userQuestion) &&
    typeof value.intent === "string" &&
    AGENT_INTENTS.has(value.intent) &&
    isBoundedStringArray(value.selectedMetrics) &&
    isBoundedStringArray(value.selectedTables) &&
    Array.isArray(generatedSql) &&
    generatedSql.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
    generatedSql.every(
      (statement) =>
        isRecord(statement) &&
        isNonEmptyString(statement.id) &&
        isNonEmptyString(statement.title) &&
        isNonEmptyBoundedString(statement.sql, AGENT_RESPONSE_LIMITS.maxSqlLength)
    ) &&
    Array.isArray(validationResults) &&
    validationResults.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
    validationResults.every(
      (result) =>
        isRecord(result) &&
        isNonEmptyString(result.id) &&
        typeof result.severity === "string" &&
        VALIDATION_SEVERITIES.has(result.severity) &&
        isBoundedString(result.message) &&
        typeof result.passed === "boolean" &&
        (result.details === undefined || isBoundedDetails(result.details))
    ) &&
    Array.isArray(executionResult) &&
    executionResult.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
    executionResult.every(
      (result) =>
        isRecord(result) &&
        Array.isArray(result.columns) &&
        result.columns.length <= AGENT_RESPONSE_LIMITS.maxColumns &&
        result.columns.every(isNonEmptyString) &&
        Array.isArray(result.rows) &&
        result.rows.length <= AGENT_RESPONSE_LIMITS.maxRows &&
        result.rows.every(isQueryRow) &&
        typeof result.rowCount === "number" &&
        Number.isInteger(result.rowCount) &&
        result.rowCount >= 0 &&
        result.rowCount <= AGENT_RESPONSE_LIMITS.maxRows &&
        result.rowCount === result.rows.length &&
        isFiniteNonNegativeNumber(result.elapsedMs) &&
        (result.isEmpty === undefined || result.isEmpty === (result.rowCount === 0)) &&
        (result.error === undefined || isBoundedString(result.error))
    ) &&
    (value.chartSpec === undefined || isChartSpec(value.chartSpec)) &&
    Array.isArray(value.traceSteps) &&
    value.traceSteps.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
    value.traceSteps.every(isTraceStep) &&
    Array.isArray(value.warnings) &&
    value.warnings.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
    value.warnings.every((warning) => isBoundedString(warning)) &&
    typeof value.guardrailDecision === "string" &&
    GUARDRAIL_DECISIONS.has(value.guardrailDecision) &&
    isBoundedString(value.finalAnswer) &&
    Array.isArray(value.suggestedFollowUps) &&
    value.suggestedFollowUps.length <= AGENT_RESPONSE_LIMITS.maxArrayItems &&
    value.suggestedFollowUps.every((followUp) => isBoundedString(followUp)) &&
    isNonEmptyString(value.createdAt)
  );

  return valid;
}

function validateEvent(value: unknown): AgentRunEvent {
  if (!isRecord(value)) {
    throw new AgentClientError("INVALID_EVENT", "Agent returned an invalid event.");
  }

  if (
    value.version !== 1 ||
    !isNonEmptyString(value.runId) ||
    !isPositiveInteger(value.sequence) ||
    !isNonEmptyString(value.timestamp) ||
    !isFiniteNonNegativeNumber(value.elapsedMs) ||
    !isFiniteNonNegativeNumber(value.durationMs) ||
    typeof value.type !== "string"
  ) {
    throw new AgentClientError("INVALID_EVENT", "Agent returned an invalid event.");
  }

  if (value.type === "run.started") {
    if (!isNonEmptyString(value.question) || !isNonEmptyString(value.topicId)) {
      throw new AgentClientError("INVALID_EVENT", "Agent returned an invalid start event.");
    }
    return value as unknown as AgentRunEvent;
  }

  if (value.type === "step.completed") {
    if (!isTraceStep(value.step)) {
      throw new AgentClientError("INVALID_EVENT", "Agent returned an invalid step event.");
    }
    return value as unknown as AgentRunEvent;
  }

  if (value.type === "run.completed") {
    if (
      !isAgentRun(value.run) ||
      !COMPLETED_EVENT_RUN_STATUSES.has(value.run.status)
    ) {
      throw new AgentClientError("INVALID_EVENT", "Agent returned an invalid completion event.");
    }

    if (deriveRunOutcome(value.run).hasOutcomeIntegrityMismatch) {
      throw new AgentClientError("INVALID_EVENT", "Agent returned an inconsistent completion event.");
    }

    return value as unknown as AgentRunCompletedEvent;
  }

  if (value.type === "run.failed") {
    if (!isRecord(value.error) || !isNonEmptyString(value.error.name) || !isNonEmptyString(value.error.message)) {
      throw new AgentClientError("INVALID_EVENT", "Agent returned an invalid failure event.");
    }
    return value as unknown as AgentRunFailedEvent;
  }

  throw new AgentClientError("INVALID_EVENT", "Agent returned an unknown event.");
}

function isAbortError(error: unknown, signal?: AbortSignal) {
  return signal?.aborted === true || (isRecord(error) && error.name === "AbortError");
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function abortError() {
  return new AgentClientError("ABORTED", "Agent run was cancelled.");
}

function protocolError(error: unknown) {
  return error instanceof AgentClientError
    ? error
    : new AgentClientError("INVALID_EVENT", "Agent returned an invalid event stream.");
}

function contentTypeIsNdjson(response: Response) {
  return response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() === NDJSON_CONTENT_TYPE;
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
  try {
    await reader.cancel();
  } catch {
    // Cancellation is best effort after a protocol or transport error.
  }
}

async function cancelResponseBody(response: Response) {
  if (!response.body) {
    return;
  }

  try {
    await response.body.cancel();
  } catch {
    // Cancellation is best effort when rejecting a response before reading it.
  }
}

export async function streamAgentRun(
  question: string,
  topicId: string,
  options: StreamAgentRunOptions = {}
): Promise<AgentRunCompletedEvent | AgentRunFailedEvent> {
  const signal = options.signal;
  const fetcher = options.fetchImpl ?? fetch;

  if (signal?.aborted) {
    throw abortError();
  }

  let response: Response;
  try {
    response = await fetcher("/api/runs", {
      method: "POST",
      headers: {
        Accept: NDJSON_CONTENT_TYPE,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question, topicId }),
      signal
    });
  } catch (error) {
    if (isAbortError(error, signal)) {
      throw abortError();
    }
    throw new AgentClientError("HTTP_ERROR", "Agent request failed.");
  }

  if (!response.ok) {
    await cancelResponseBody(response);
    throw new AgentClientError("HTTP_ERROR", "Agent request was rejected.", response.status);
  }

  if (!contentTypeIsNdjson(response) || response.headers.get("x-agent-transport") !== AGENT_TRANSPORT) {
    await cancelResponseBody(response);
    throw new AgentClientError("INVALID_RESPONSE", "Agent returned an unsupported response.", response.status);
  }

  if (!response.body) {
    throw new AgentClientError("MISSING_STREAM", "Agent response did not include a stream.", response.status);
  }

  const responseRunId = response.headers.get("x-run-id");
  if (!isNonEmptyString(responseRunId)) {
    await cancelResponseBody(response);
    throw new AgentClientError("INVALID_RESPONSE", "Agent response did not include a valid run identifier.", response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";
  let expectedSequence = 1;
  const expectedQuestion = question.trim();
  const expectedTopicId = topicId;
  const runId = responseRunId;
  let receivedBytes = 0;
  let eventCount = 0;
  let terminal: AgentRunCompletedEvent | AgentRunFailedEvent | undefined;
  let terminalSeen = false;
  const abortListener = signal
    ? () => {
        void cancelReader(reader);
      }
    : undefined;

  if (abortListener && signal) {
    signal.addEventListener("abort", abortListener, { once: true });
  }

  const notifyEvent = async (event: AgentRunEvent) => {
    if (!options.onEvent) {
      return;
    }

    try {
      await options.onEvent(event);
    } catch {
      throw new AgentClientError("CALLBACK_ERROR", "Agent event handling failed.");
    }
  };

  const consumeLine = async (line: string) => {
    if (line.length === 0) {
      return;
    }

    if (utf8ByteLength(line) > AGENT_RESPONSE_LIMITS.maxLineBytes) {
      throw new AgentClientError("RESPONSE_TOO_LARGE", "Agent returned an event line that is too large.");
    }

    eventCount += 1;
    if (eventCount > AGENT_RESPONSE_LIMITS.maxEvents) {
      throw new AgentClientError("RESPONSE_TOO_LARGE", "Agent returned too many events.");
    }

    if (terminalSeen) {
      throw new AgentClientError("EVENT_ORDER", "Agent returned an event after completion.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new AgentClientError("INVALID_EVENT", "Agent returned malformed event data.");
    }

    const event = validateEvent(parsed);

    if (event.sequence !== expectedSequence) {
      throw new AgentClientError("EVENT_ORDER", "Agent events were returned out of order.");
    }

    if (event.runId !== runId) {
      throw new AgentClientError("EVENT_ORDER", "Agent events used inconsistent run identifiers.");
    }

    if (expectedSequence === 1 && event.type !== "run.started") {
      throw new AgentClientError("EVENT_ORDER", "Agent stream did not start with run.started.");
    }

    if (event.type === "run.started" && expectedSequence !== 1) {
      throw new AgentClientError("EVENT_ORDER", "Agent stream included more than one run.started event.");
    }

    if (event.type === "run.started" && (event.question !== expectedQuestion || event.topicId !== expectedTopicId)) {
      throw new AgentClientError("EVENT_ORDER", "Agent start event did not match the requested run.");
    }

    if (
      event.type === "run.completed" &&
      (event.run.runId !== runId || event.run.userQuestion !== expectedQuestion || event.run.topicId !== expectedTopicId)
    ) {
      throw new AgentClientError("INVALID_RESPONSE", "Agent completion did not match the requested run.");
    }

    expectedSequence += 1;

    if (TERMINAL_EVENT_TYPES.has(event.type)) {
      terminalSeen = true;
      terminal = event as AgentRunCompletedEvent | AgentRunFailedEvent;
      return;
    }

    await notifyEvent(event);
  };

  try {
    while (true) {
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await reader.read();
      } catch (error) {
        if (isAbortError(error, signal)) {
          throw abortError();
        }
        throw new AgentClientError("INVALID_RESPONSE", "Agent stream could not be read.");
      }

      if (result.done) {
        if (signal?.aborted) {
          throw abortError();
        }
        break;
      }

      receivedBytes += result.value.byteLength;
      if (receivedBytes > AGENT_RESPONSE_LIMITS.maxTotalBytes) {
        throw new AgentClientError("RESPONSE_TOO_LARGE", "Agent response exceeded the size limit.");
      }

      if (signal?.aborted) {
        throw abortError();
      }

      try {
        buffer += decoder.decode(result.value, { stream: true });
      } catch {
        throw new AgentClientError("INVALID_EVENT", "Agent returned invalid UTF-8 data.");
      }

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
        buffer = buffer.slice(newlineIndex + 1);
        await consumeLine(line);
        newlineIndex = buffer.indexOf("\n");
      }

      if (utf8ByteLength(buffer) > AGENT_RESPONSE_LIMITS.maxLineBytes) {
        throw new AgentClientError("RESPONSE_TOO_LARGE", "Agent returned an event line that is too large.");
      }
    }

    try {
      buffer += decoder.decode();
    } catch {
      throw new AgentClientError("INVALID_EVENT", "Agent returned invalid UTF-8 data.");
    }

    if (buffer.length > 0) {
      await consumeLine(buffer.replace(/\r$/, ""));
    }

    if (!terminal) {
      throw new AgentClientError("MISSING_TERMINAL", "Agent stream ended without a terminal event.");
    }

    await notifyEvent(terminal);
    return terminal;
  } catch (error) {
    await cancelReader(reader);
    if (isAbortError(error, signal)) {
      throw abortError();
    }
    throw protocolError(error);
  } finally {
    if (abortListener) {
      signal?.removeEventListener("abort", abortListener);
    }
    try {
      reader.releaseLock();
    } catch {
      // The stream may already have released the lock after cancellation.
    }
  }
}
