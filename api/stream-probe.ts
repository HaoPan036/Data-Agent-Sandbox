const probeEvents = [
  { version: 1, sequence: 1, type: "probe.started" },
  { version: 1, sequence: 2, type: "probe.capability" },
  { version: 1, sequence: 3, type: "probe.completed" }
].map((event) => `${JSON.stringify(event)}\n`);

export function GET(): Response {
  let nextEvent = 0;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      const event = probeEvents[nextEvent];
      if (event === undefined) {
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode(event));
      nextEvent += 1;

      if (nextEvent === probeEvents.length) {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
