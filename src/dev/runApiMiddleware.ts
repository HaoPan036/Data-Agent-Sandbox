import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { handleRunRequest } from "../../api/runs.js";

const RUNS_PATH = "/api/runs";
const METHOD_NOT_ALLOWED = JSON.stringify({
  code: "METHOD_NOT_ALLOWED",
  message: "Method not allowed."
});
const INTERNAL_ERROR = JSON.stringify({
  code: "INTERNAL_SERVER_ERROR",
  message: "The request could not be completed."
});

export type RunRequestHandler = (request: Request) => Promise<Response>;
export type RunApiMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
) => void;

function requestPath(request: IncomingMessage) {
  return (request.url ?? "").split("?", 1)[0];
}

function setRequestHeaders(request: IncomingMessage) {
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined) {
      continue;
    }

    for (const entry of Array.isArray(value) ? value : [value]) {
      headers.append(name, entry);
    }
  }

  return headers;
}

function createWebRequest(
  request: IncomingMessage,
  signal: AbortSignal
) {
  const body = Readable.toWeb(request) as unknown as ReadableStream<Uint8Array>;
  const host = request.headers.host ?? "localhost";

  return new Request(`http://${host}${request.url ?? RUNS_PATH}`, {
    method: request.method,
    headers: setRequestHeaders(request),
    body,
    signal,
    duplex: "half"
  } as RequestInit & { duplex: "half" });
}

function writeStableJson(
  response: ServerResponse,
  status: number,
  body: string,
  headers: Record<string, string> = {}
) {
  if (response.headersSent || response.destroyed) {
    response.destroy();
    return;
  }

  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");

  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }

  response.end(body);
}

function writeChunk(response: ServerResponse, chunk: Uint8Array) {
  if (response.destroyed || response.writableEnded) {
    return Promise.reject(new Error("Response closed."));
  }

  if (response.write(chunk)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const onDrain = () => {
      cleanup();
      resolve();
    };
    const onClose = () => {
      cleanup();
      reject(new Error("Response closed."));
    };
    const onError = () => {
      cleanup();
      reject(new Error("Response write failed."));
    };
    const cleanup = () => {
      response.removeListener("drain", onDrain);
      response.removeListener("close", onClose);
      response.removeListener("error", onError);
    };

    response.once("drain", onDrain);
    response.once("close", onClose);
    response.once("error", onError);
  });
}

async function cancelResponseBody(source: Response) {
  if (!source.body) {
    return;
  }

  await source.body.cancel().catch(() => undefined);
}

async function forwardResponse(
  source: Response,
  destination: ServerResponse,
  onCancel: () => void,
  onReader: (reader: ReadableStreamDefaultReader<Uint8Array>) => void
) {
  for (const [name, value] of source.headers) {
    destination.setHeader(name, value);
  }
  destination.statusCode = source.status;

  if (!source.body) {
    destination.end();
    return;
  }

  const reader = source.body.getReader();
  onReader(reader);
  let complete = false;

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        complete = true;
        break;
      }

      await writeChunk(destination, result.value);
    }

    if (!destination.destroyed && !destination.writableEnded) {
      destination.end();
    }
  } catch {
    onCancel();

    if (!destination.destroyed && !destination.writableEnded) {
      destination.destroy();
    }
  } finally {
    if (!complete) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
}

export function createRunApiMiddleware(
  handler: RunRequestHandler = handleRunRequest
): RunApiMiddleware {
  return (request, response, next) => {
    if (requestPath(request) !== RUNS_PATH) {
      next();
      return;
    }

    if (request.method !== "POST") {
      writeStableJson(response, 405, METHOD_NOT_ALLOWED, { Allow: "POST" });
      return;
    }

    const abortController = new AbortController();
    let sourceReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let finished = false;

    const abort = () => {
      if (abortController.signal.aborted) {
        return;
      }

      abortController.abort();
      void sourceReader?.cancel().catch(() => undefined);

      if (!request.complete && !request.destroyed) {
        request.destroy();
      }
    };
    const onRequestAborted = () => abort();
    const onResponseClose = () => {
      if (!finished) {
        abort();
      }
    };

    request.once("aborted", onRequestAborted);
    request.once("error", onRequestAborted);
    response.once("close", onResponseClose);

    void (async () => {
      try {
        const webResponse = await handler(createWebRequest(request, abortController.signal));

        if (abortController.signal.aborted || response.destroyed) {
          await cancelResponseBody(webResponse);
          return;
        }

        await forwardResponse(webResponse, response, abort, (reader) => {
          sourceReader = reader;
        });
      } catch {
        if (!response.destroyed && !response.writableEnded) {
          try {
            writeStableJson(response, 500, INTERNAL_ERROR);
          } catch {
            response.destroy();
          }
        }
      } finally {
        finished = true;
        request.removeListener("aborted", onRequestAborted);
        request.removeListener("error", onRequestAborted);
        response.removeListener("close", onResponseClose);
        sourceReader = undefined;
      }
    })();
  };
}

type MiddlewareServer = Pick<ViteDevServer | PreviewServer, "middlewares">;

function installRunApiMiddleware(server: MiddlewareServer) {
  server.middlewares.use(createRunApiMiddleware());
}

export function runApiPlugin(): Plugin {
  return {
    name: "local-agent-run-api",
    configureServer: installRunApiMiddleware,
    configurePreviewServer: installRunApiMiddleware
  };
}
