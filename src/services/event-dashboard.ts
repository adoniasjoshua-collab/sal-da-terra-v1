import type { AttendanceMode, EventStatus, EventType } from "@/types/database";

export type EventDashboardEvent = {
  id: string;
  title: string;
  type: EventType;
  event_date: string;
  status: EventStatus;
  attendance_mode: AttendanceMode;
};

export type EventDashboardAttendance = {
  event_id: string;
  student_id: string;
  attendance_status: "present" | "absent" | "justified" | "visitor" | "not_participated";
};

export type EventDashboardHeadcount = {
  event_id: string;
  adolescent_count: number;
  visitor_count: number;
  is_estimated: boolean;
};

export type EventCategoryMetric = {
  type: EventType;
  eventCount: number;
  participations: number;
  identifiedUnique: number;
  identifiedEventCount: number;
  aggregateEventCount: number;
};

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function participationForEvent(
  event: EventDashboardEvent,
  attendance: EventDashboardAttendance[],
  headcounts: EventDashboardHeadcount[],
) {
  if (event.attendance_mode === "headcount_only") {
    return headcounts.find((item) => item.event_id === event.id)?.adolescent_count ?? 0;
  }
  return attendance.filter((item) => item.event_id === event.id && (item.attendance_status === "present" || item.attendance_status === "visitor")).length;
}

export function buildEventDashboard(
  allEvents: EventDashboardEvent[],
  attendance: EventDashboardAttendance[],
  headcounts: EventDashboardHeadcount[],
  today: string,
) {
  const nonEbd = allEvents.filter((event) => event.type !== "EBD");
  const start = shiftDate(today, -89);
  const next30 = shiftDate(today, 30);
  const completed = nonEbd.filter((event) => event.status === "completed" && event.event_date >= start && event.event_date <= today);
  const upcoming = nonEbd.filter((event) => ["planned", "open"].includes(event.status) && event.event_date >= today && event.event_date <= next30).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const pending = nonEbd.filter((event) => ["planned", "open"].includes(event.status) && event.event_date < today).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const identifiedStudents = new Set<string>();
  const categories = new Map<EventType, EventCategoryMetric>();

  for (const event of completed) {
    const metric = categories.get(event.type) ?? { type: event.type, eventCount: 0, participations: 0, identifiedUnique: 0, identifiedEventCount: 0, aggregateEventCount: 0 };
    const eventAttendance = attendance.filter((item) => item.event_id === event.id && (item.attendance_status === "present" || item.attendance_status === "visitor"));
    metric.eventCount += 1;
    metric.participations += participationForEvent(event, attendance, headcounts);
    if (event.attendance_mode === "headcount_only") {
      metric.aggregateEventCount += 1;
    } else {
      metric.identifiedEventCount += 1;
      eventAttendance.forEach((item) => identifiedStudents.add(item.student_id));
    }
    categories.set(event.type, metric);
  }

  for (const metric of categories.values()) {
    const eventIds = new Set(completed.filter((event) => event.type === metric.type && event.attendance_mode !== "headcount_only").map((event) => event.id));
    metric.identifiedUnique = new Set(attendance.filter((item) => eventIds.has(item.event_id) && (item.attendance_status === "present" || item.attendance_status === "visitor")).map((item) => item.student_id)).size;
  }

  const estimatedCount = completed.filter((event) => event.attendance_mode === "headcount_only" && headcounts.some((item) => item.event_id === event.id && item.is_estimated)).length;

  return {
    completed,
    upcoming,
    pending,
    categories: [...categories.values()].sort((a, b) => b.participations - a.participations || a.type.localeCompare(b.type)),
    participationTotal: completed.reduce((sum, event) => sum + participationForEvent(event, attendance, headcounts), 0),
    identifiedUnique: identifiedStudents.size,
    estimatedCount,
  };
}
