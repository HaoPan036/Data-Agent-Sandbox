import { describe, expect, it } from "vitest";
import { routeIntent } from "./intentRouter";

describe("routeIntent", () => {
  it("routes regional revenue questions", () => {
    const intent = routeIntent("Which region generated the most revenue?");

    expect(intent.id).toBe("regional_revenue");
  });

  it("routes category ranking questions", () => {
    const intent = routeIntent("Rank top product categories by revenue.");

    expect(intent.id).toBe("top_categories");
  });

  it("falls back to monthly revenue trend", () => {
    const intent = routeIntent("What happened?");

    expect(intent.id).toBe("monthly_revenue_trend");
  });
});

