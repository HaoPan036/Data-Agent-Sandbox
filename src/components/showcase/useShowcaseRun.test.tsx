import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useShowcaseRun } from "./useShowcaseRun";

function AutoRunHarness() {
  useShowcaseRun("What was total revenue last week?", "retail-growth-demo");
  return null;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useShowcaseRun", () => {
  it("starts exactly one automatic request in StrictMode and aborts it on unmount", async () => {
    let requestSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined;

      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true }
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const view = render(
      <StrictMode>
        <AutoRunHarness />
      </StrictMode>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(requestSignal?.aborted).toBe(false);

    view.unmount();

    expect(requestSignal?.aborted).toBe(true);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
