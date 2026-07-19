// @vitest-environment node
import { createServer, request as createClientRequest, type Server } from "node:http";
import type {
  MinimalPluginContextWithoutEnvironment,
  PreviewServer,
  ViteDevServer
} from "vite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRunApiMiddleware, runApiPlugin } from "./runApiMiddleware";

const servers: Server[] = [];

function listen(server: Server) {
  servers.push(server);

  return new Promise<number>((resolve, reject) => {
    const onError = (error: Error) => {
      server.removeListener("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("The test server did not receive an ephemeral address."));
        return;
      }

      resolve(address.port);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, "127.0.0.1");
  });
}

async function close(server: Server) {
  if (!server.listening) {
    return;
  }

  await new Promise<void>((resolve) => server.close(() => resolve()));
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(close));
});

function createTestServer() {
  const middleware = createRunApiMiddleware();

  return createServer((request, response) => {
    middleware(request, response, () => {
      response.statusCode = 404;
      response.end("next");
    });
  });
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function middlewareRegistration() {
  const use = vi.fn();

  return {
    server: {
      middlewares: { use }
    },
    use
  };
}

describe("local /api/runs middleware", () => {
  it("registers the same API middleware for dev and preview servers", () => {
    const plugin = runApiPlugin();
    const dev = middlewareRegistration();
    const preview = middlewareRegistration();

    if (
      typeof plugin.configureServer !== "function" ||
      typeof plugin.configurePreviewServer !== "function"
    ) {
      throw new Error("Expected callable Vite server hooks.");
    }

    const context = {} as MinimalPluginContextWithoutEnvironment;
    plugin.configureServer.call(
      context,
      dev.server as unknown as ViteDevServer
    );
    plugin.configurePreviewServer.call(
      context,
      preview.server as unknown as PreviewServer
    );

    expect(dev.use).toHaveBeenCalledOnce();
    expect(preview.use).toHaveBeenCalledOnce();
    expect(dev.use.mock.calls[0]?.[0]).toBeTypeOf("function");
    expect(preview.use.mock.calls[0]?.[0]).toBeTypeOf("function");
  });

  it("forwards a real deterministic run as streamed NDJSON", async () => {
    const server = createTestServer();
    const port = await listen(server);
    const response = await fetch(`http://127.0.0.1:${port}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What was total revenue last week?",
        topicId: "retail-growth-demo"
      })
    });
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) =>
        JSON.parse(line) as {
          type: string;
          run?: { generatedSql?: { sql: string }[]; executionResult?: unknown[] };
        }
      );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(events[0]?.type).toBe("run.started");
    expect(events.at(-1)?.type).toBe("run.completed");
    expect(events.at(-1)?.run?.generatedSql?.[0]?.sql).toContain("SELECT");
    expect(events.at(-1)?.run?.executionResult?.length).toBeGreaterThan(0);
  });

  it("returns a stable 405 for methods other than POST", async () => {
    const server = createTestServer();
    const port = await listen(server);
    const response = await fetch(`http://127.0.0.1:${port}/api/runs`, { method: "GET" });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(await response.json()).toEqual({
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed."
    });
  });

  it("passes unrelated paths to the next middleware", async () => {
    const server = createTestServer();
    const port = await listen(server);
    const response = await fetch(`http://127.0.0.1:${port}/api/other`);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("next");
  });

  it("cancels a resolved response body when the client disconnects before forwarding", async () => {
    const handlerStarted = deferred();
    const clientDisconnected = deferred();
    const bodyCancelled = deferred();
    const cancelSpy = vi.fn(() => bodyCancelled.resolve());
    const handler = async (request: Request) => {
      handlerStarted.resolve();
      await new Promise<void>((resolve) => {
        if (request.signal.aborted) {
          resolve();
          return;
        }

        request.signal.addEventListener("abort", () => resolve(), { once: true });
      });

      return new Response(
        new ReadableStream({
          cancel: cancelSpy
        })
      );
    };
    const middleware = createRunApiMiddleware(handler);
    const server = createServer((request, response) => {
      middleware(request, response, () => {
        response.statusCode = 404;
        response.end("next");
      });
    });
    const port = await listen(server);

    const client = createClientRequest({
      hostname: "127.0.0.1",
      port,
      path: "/api/runs",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    client.on("error", () => clientDisconnected.resolve());
    client.write("{}");
    await handlerStarted.promise;
    client.destroy();
    await clientDisconnected.promise;

    await expect(bodyCancelled.promise).resolves.toBeUndefined();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });
});
