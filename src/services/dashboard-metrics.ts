import type { AttendanceStatus } from "@/services/attendance";

export type DashboardAttendance = {
  event_id: string;
  attendance_status: AttendanceStatus | "not_participated";
};

export type EbdSummary = {
  id: string;
  date: string;
  title: string;
  present: number;
  absent: number;
  justified: number;
  visitor: number;
  operationalRate: number | null;
};

export function calculateOperationalRate(present: number, absent: number) {
  const eligible = present + absent;
  return eligible === 0 ? null : Math.round((present / eligible) * 100);
}

export function summarizeEbd(
  event: { id: string; event_date: string; title: string },
  attendance: DashboardAttendance[],
): EbdSummary {
  const rows = attendance.filter((row) => row.event_id === event.id);
  const count = (status: AttendanceStatus) => rows.filter((row) => row.attendance_status === status).length;
  const present = count("present");
  const absent = count("absent");

  return {
    id: event.id,
    date: event.event_date,
    title: event.title,
    present,
    absent,
    justified: count("justified"),
    visitor: count("visitor"),
    operationalRate: calculateOperationalRate(present, absent),
  };
}

export function combinedOperationalRate(summaries: EbdSummary[]) {
  const present = summaries.reduce((sum, item) => sum + item.present, 0);
  const absent = summaries.reduce((sum, item) => sum + item.absent, 0);
  return calculateOperationalRate(present, absent);
}

export function rateDelta(current: number | null, previous: number | null) {
  return current === null || previous === null ? null : current - previous;
}
