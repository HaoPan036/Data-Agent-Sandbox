import { z } from "zod";

export const MAX_REQUEST_BYTES = 8192;
export const MAX_QUESTION_LENGTH = 500;

export const EXECUTABLE_TOPIC_IDS = [
  "retail-growth-demo",
  "experiment-metrics-demo"
] as const;

export const runRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
    topicId: z.enum(EXECUTABLE_TOPIC_IDS)
  })
  .strict();

export type RunRequest = z.infer<typeof runRequestSchema>;

export type RunRequestParseResult =
  | { ok: true; value: RunRequest }
  | { ok: false; status: 400 | 413 | 415; code: string; message: string };

function isJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type");
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function hasOversizedContentLength(request: Request) {
  const contentLength = request.headers.get("content-length")?.trim();

  if (!contentLength || !/^\d+$/.test(contentLength)) {
    return false;
  }

  return Number(contentLength) > MAX_REQUEST_BYTES;
}

function bodyReadError(): RunRequestParseResult {
  return {
    ok: false,
    status: 400,
    code: "INVALID_REQUEST",
    message: "Request body could not be read."
  };
}

function oversizedBodyError(): RunRequestParseResult {
  return {
    ok: false,
    status: 413,
    code: "PAYLOAD_TOO_LARGE",
    message: "Request body is too large."
  };
}

type ReadRequestBodyResult =
  | { ok: true; body: Uint8Array }
  | RunRequestParseResult;

async function readRequestBody(request: Request): Promise<ReadRequestBodyResult> {
  if (!request.body) {
    return { ok: true, body: new Uint8Array() };
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>;

  try {
    reader = request.body.getReader();
  } catch {
    return bodyReadError();
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      const chunk = result.value;
      totalBytes += chunk.byteLength;

      if (totalBytes > MAX_REQUEST_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Cancellation is best effort after the payload limit is known.
        }

        return oversizedBodyError();
      }

      chunks.push(chunk);
    }
  } catch {
    return bodyReadError();
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Releasing a finished or cancelled reader should be harmless.
    }
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, body };
}

export async function parseRunRequest(request: Request): Promise<RunRequestParseResult> {
  if (!isJsonContentType(request)) {
    return {
      ok: false,
      status: 415,
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Request must use application/json."
    };
  }

  if (hasOversizedContentLength(request)) {
    return {
      ok: false,
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "Request body is too large."
    };
  }

  const bodyResult = await readRequestBody(request);

  if (!("body" in bodyResult)) {
    return bodyResult;
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(new TextDecoder().decode(bodyResult.body));
  } catch {
    return {
      ok: false,
      status: 400,
      code: "INVALID_JSON",
      message: "Request body must be valid JSON."
    };
  }

  const parsedRequest = runRequestSchema.safeParse(parsedBody);

  if (!parsedRequest.success) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      message: "Request must include a valid question and executable topicId."
    };
  }

  return { ok: true, value: parsedRequest.data };
}
