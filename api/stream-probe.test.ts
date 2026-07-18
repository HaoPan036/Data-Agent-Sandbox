import { describe, expect, it } from "vitest";
import { GET } from "./stream-probe";

describe("GET /api/stream-probe", () => {
  it("returns ordered, terminal NDJSON events", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/x-ndjson; charset=utf-8"
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.body).not.toBeNull();

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let body = "";
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value !== undefined) {
        body += decoder.decode(result.value, { stream: !done });
      }
    }

    body += decoder.decode();
    const lines = body.split("\n");
    expect(lines.at(-1)).toBe("");

    const events = lines.slice(0, -1).map((line) => JSON.parse(line));
    expect(events).toHaveLength(3);
    expect(events.map((event) => event.type)).toEqual([
      "probe.started",
      "probe.capability",
      "probe.completed"
    ]);
    expect(events.map((event) => event.sequence)).toEqual([1, 2, 3]);
    expect(events.every((event) => event.version === 1)).toBe(true);
    expect(events.at(-1)?.type).toBe("probe.completed");

    const terminalRead = await reader.read();
    expect(terminalRead.done).toBe(true);
  });
});
