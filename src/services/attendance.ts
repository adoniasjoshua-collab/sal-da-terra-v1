export type AttendanceStatus = "present" | "absent" | "justified" | "visitor";

export type AttendanceRecord = { eventDate: string; status: AttendanceStatus };

export type AttendanceMetrics = {
  total: number; present: number; absent: number; justified: number; visitor: number;
  presenceRate: number; consecutiveAbsences: number; currentPresenceStreak: number;
  longestPresenceStreak: number; lastPresence: string | null;
};

export function calculateAttendanceMetrics(records: AttendanceRecord[]): AttendanceMetrics {
  const ordered = [...records].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const count = (status: AttendanceStatus) => ordered.filter((item) => item.status === status).length;
  const present = count("present");
  let consecutiveAbsences = 0;
  for (const item of ordered) { if (item.status !== "absent") break; consecutiveAbsences += 1; }
  let currentPresenceStreak = 0;
  for (const item of ordered) { if (item.status !== "present") break; currentPresenceStreak += 1; }
  let run = 0;
  let longestPresenceStreak = 0;
  for (const item of [...ordered].reverse()) {
    run = item.status === "present" ? run + 1 : 0;
    longestPresenceStreak = Math.max(longestPresenceStreak, run);
  }
  return {
    total: ordered.length, present, absent: count("absent"), justified: count("justified"), visitor: count("visitor"),
    presenceRate: ordered.length === 0 ? 0 : Math.round((present / ordered.length) * 100),
    consecutiveAbsences, currentPresenceStreak, longestPresenceStreak,
    lastPresence: ordered.find((item) => item.status === "present")?.eventDate ?? null,
  };
}
