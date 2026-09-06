import { describe, expect, it } from "vitest";
import { calculateAttendanceMetrics } from "../src/services/attendance";

describe("attendance metrics", () => {
  it("calculates totals, rate, streaks and last presence", () => {
    const result = calculateAttendanceMetrics([
      { eventDate: "2026-08-02", status: "present" }, { eventDate: "2026-08-09", status: "present" },
      { eventDate: "2026-08-16", status: "justified" }, { eventDate: "2026-08-23", status: "absent" },
      { eventDate: "2026-08-30", status: "absent" },
    ]);
    expect(result).toMatchObject({ total: 5, present: 2, absent: 2, justified: 1, presenceRate: 40, consecutiveAbsences: 2, longestPresenceStreak: 2, lastPresence: "2026-08-09" });
  });

  it("does not treat justified absence as an ordinary consecutive absence", () => {
    const result = calculateAttendanceMetrics([
      { eventDate: "2026-08-30", status: "absent" }, { eventDate: "2026-08-23", status: "justified" }, { eventDate: "2026-08-16", status: "absent" },
    ]);
    expect(result.consecutiveAbsences).toBe(1);
  });

  it("returns safe zero values for no events", () => {
    expect(calculateAttendanceMetrics([])).toMatchObject({ total: 0, presenceRate: 0, lastPresence: null });
  });
});
