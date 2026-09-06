import { describe, expect, it } from "vitest";
import { calculateOperationalRate, combinedOperationalRate, rateDelta, summarizeEbd } from "../src/services/dashboard-metrics";

describe("dashboard metrics", () => {
  it("excludes justified attendance and visitors from the operational rate", () => {
    const summary = summarizeEbd(
      { id: "event-1", event_date: "2026-09-06", title: "EBD" },
      [
        { event_id: "event-1", attendance_status: "present" },
        { event_id: "event-1", attendance_status: "absent" },
        { event_id: "event-1", attendance_status: "justified" },
        { event_id: "event-1", attendance_status: "visitor" },
      ],
    );

    expect(summary.operationalRate).toBe(50);
    expect(summary.justified).toBe(1);
    expect(summary.visitor).toBe(1);
  });

  it("returns no rate when there are no present or absent records", () => {
    expect(calculateOperationalRate(0, 0)).toBeNull();
  });

  it("combines EBDs using attendance records as weights", () => {
    const base = { id: "event", date: "2026-09-06", title: "EBD", justified: 0, visitor: 0 };
    expect(combinedOperationalRate([
      { ...base, present: 8, absent: 2, operationalRate: 80 },
      { ...base, id: "event-2", present: 6, absent: 4, operationalRate: 60 },
    ])).toBe(70);
  });

  it("calculates percentage-point movement only with two valid periods", () => {
    expect(rateDelta(80, 72)).toBe(8);
    expect(rateDelta(80, null)).toBeNull();
  });
});
