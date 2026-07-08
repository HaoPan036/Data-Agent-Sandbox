import { describe, expect, it } from "vitest";
import {
  campaigns,
  categories,
  channels,
  customers_masked,
  experiment_events,
  orders,
  products,
  refunds,
  regions,
  syntheticDataNotes,
  traffic
} from "./syntheticEcommerce";

function countRowsBetween<T>(
  rows: T[],
  getDate: (row: T) => string,
  start: string,
  end: string
) {
  return rows.filter((row) => {
    const date = getDate(row);
    return date >= start && date <= end;
  }).length;
}

describe("synthetic ecommerce data", () => {
  it("creates meaningful local tables", () => {
    expect(new Set(traffic.map((row) => row.date)).size).toBeGreaterThanOrEqual(180);
    expect(new Set(traffic.map((row) => row.region)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(traffic.map((row) => row.channel)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(products.map((row) => row.category)).size).toBeGreaterThanOrEqual(5);
    expect(campaigns.length).toBeGreaterThanOrEqual(3);
    expect(new Set(experiment_events.map((row) => row.experiment_id)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(experiment_events.map((row) => row.variant)).size).toBeGreaterThanOrEqual(2);
    expect(orders.length).toBeGreaterThan(0);
    expect(refunds.length).toBeGreaterThan(0);
    expect(customers_masked.every((customer) => customer.is_sensitive_masked)).toBe(true);
  });

  it("uses the requested public dimensions", () => {
    expect([...regions]).toEqual(["Singapore", "Malaysia", "Thailand", "Indonesia"]);
    expect([...channels]).toEqual(["Organic", "Paid Search", "Social", "Affiliate"]);
    expect([...categories]).toEqual(["Electronics", "Beauty", "Home", "Fashion", "Groceries"]);
  });

  it("includes a refund spike and incomplete latest week scenario", () => {
    const spikeRefunds = countRowsBetween(
      refunds,
      (refund) => refund.refund_date,
      "2026-05-14",
      "2026-05-29"
    );
    const baselineRefunds = countRowsBetween(
      refunds,
      (refund) => refund.refund_date,
      "2026-04-14",
      "2026-04-29"
    );

    expect(spikeRefunds).toBeGreaterThan(baselineRefunds);
    expect(syntheticDataNotes.incompleteLatestWeek.latestAvailableDate).toBe("2026-07-05");
  });
});
