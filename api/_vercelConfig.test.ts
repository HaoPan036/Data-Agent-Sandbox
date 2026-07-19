// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface VercelHeader {
  key: string;
  value: string;
}

interface VercelConfig {
  headers?: Array<{
    source: string;
    headers: VercelHeader[];
  }>;
}

function readVercelConfig() {
  return JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8")
  ) as VercelConfig;
}

describe("Vercel security headers", () => {
  it("keeps strict CSP report-only while Evaluation and Skill Runner execute AlaSQL in the browser", () => {
    const config = readVercelConfig();
    const route = config.headers?.find((candidate) => candidate.source === "/(.*)");
    const headers = Object.fromEntries(
      (route?.headers ?? []).map((header) => [header.key, header.value])
    );

    expect(headers).toMatchObject({
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    });

    const expectedStrictPolicy =
      "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self' blob:";
    const policy = headers["Content-Security-Policy-Report-Only"];
    const scriptSources = policy
      ?.split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src"))
      ?.split(/\s+/)
      .slice(1);

    // Enforce only after browser-side AlaSQL execution has moved behind the API.
    expect(headers["Content-Security-Policy"]).toBeUndefined();
    expect(policy).toBe(expectedStrictPolicy);
    expect(scriptSources).toEqual(["'self'"]);
    expect(scriptSources).not.toContain("'unsafe-eval'");
    expect(scriptSources).not.toContain("*");
  });
});
