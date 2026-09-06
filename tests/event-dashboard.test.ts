import { describe, expect, it } from "vitest";
import { buildEventDashboard, participationForEvent, type EventDashboardEvent } from "../src/services/event-dashboard";

const aggregateEvent: EventDashboardEvent = { id: "worship-1", title: "Culto", type: "worship", event_date: "2026-09-05", status: "completed", attendance_mode: "headcount_only" };
const namedEvent: EventDashboardEvent = { id: "action-1", title: "Ação", type: "volunteer_action", event_date: "2026-09-04", status: "completed", attendance_mode: "participation_only" };

describe("event dashboard", () => {
  it("uses the aggregate count without inventing identities", () => {
    expect(participationForEvent(aggregateEvent, [], [{ event_id: "worship-1", adolescent_count: 20, visitor_count: 4, is_estimated: false }])).toBe(20);
  });

  it("counts only identified participants in named events", () => {
    expect(participationForEvent(namedEvent, [
      { event_id: "action-1", student_id: "a", attendance_status: "present" },
      { event_id: "action-1", student_id: "b", attendance_status: "visitor" },
      { event_id: "action-1", student_id: "c", attendance_status: "not_participated" },
    ], [])).toBe(2);
  });

  it("separates volume, unique identities, upcoming events and overdue records", () => {
    const result = buildEventDashboard([
      aggregateEvent,
      namedEvent,
      { ...namedEvent, id: "action-2", event_date: "2026-09-07", status: "planned" },
      { ...namedEvent, id: "action-3", event_date: "2026-09-01", status: "open" },
      { ...namedEvent, id: "ebd", type: "EBD", status: "completed" },
    ], [
      { event_id: "action-1", student_id: "a", attendance_status: "present" },
      { event_id: "action-1", student_id: "b", attendance_status: "present" },
    ], [{ event_id: "worship-1", adolescent_count: 20, visitor_count: 4, is_estimated: true }], "2026-09-06");

    expect(result.completed).toHaveLength(2);
    expect(result.participationTotal).toBe(22);
    expect(result.identifiedUnique).toBe(2);
    expect(result.upcoming).toHaveLength(1);
    expect(result.pending).toHaveLength(1);
    expect(result.estimatedCount).toBe(1);
  });
});
