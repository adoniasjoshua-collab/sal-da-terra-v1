import { describe, expect, it } from "vitest";
import type { AttendanceStatus } from "../src/services/attendance";
import { summarizeEbd } from "../src/services/dashboard-metrics";
import { buildLeaderActions, type LeaderActionStudent } from "../src/services/leader-actions";
import { getRadarStatus } from "../src/services/pastoral-radar";

const today = "2026-11-16";
const dates = ["2026-11-15", "2026-11-08", "2026-11-01", "2026-10-25", "2026-10-18"];

function student(id: string, statuses: AttendanceStatus[], extra: Partial<LeaderActionStudent> = {}): LeaderActionStudent {
  const records = statuses.map((status, index) => ({ eventDate: dates[index], status }));
  let streak = 0;
  for (const record of records) { if (record.status !== "absent") break; streak += 1; }
  return { id, name: id, status: "active", radar: getRadarStatus(streak), consecutiveAbsences: streak, records, lastContact: null, ...extra };
}

function summaries(students: LeaderActionStudent[]) {
  return dates.map((date, index) => summarizeEbd(
    { id: `ebd-${index}`, event_date: date, title: "EBD" },
    students.flatMap((item) => item.records.filter((record) => record.eventDate === date).map((record) => ({ event_id: `ebd-${index}`, attendance_status: record.status }))),
  ));
}

function run(students: LeaderActionStudent[], pendingEvents: { id: string; title: string; event_date: string }[] = []) {
  return buildLeaderActions({ today, students, summaries: summaries(students), pendingEvents });
}

describe("leader weekly actions", () => {
  it("suggests an action per radar level, most urgent first", () => {
    const result = run([
      student("ana", ["absent", "absent", "present"]),
      student("bia", ["absent", "absent", "absent", "absent", "present"]),
      student("caio", ["absent", "absent", "absent", "present"]),
    ]);
    expect(result.items.map((item) => [item.title, item.kind])).toEqual([
      ["bia", "radar_priority"], ["caio", "radar_follow_up"], ["ana", "radar_attention"],
    ]);
    expect(result.items[0].href).toBe("/adolescentes/bia#acompanhamentos");
  });

  it("drops a radar student contacted in the last 7 days but keeps an older contact", () => {
    const result = run([
      student("ana", ["absent", "absent"], { lastContact: "2026-11-10" }),
      student("bia", ["absent", "absent"], { lastContact: "2026-11-01" }),
    ]);
    expect(result.items.map((item) => item.title)).toEqual(["bia"]);
    expect(result.items[0].detail).toContain("Último contato: 01/11");
  });

  it("welcomes a student back after a radar streak", () => {
    const result = run([student("ana", ["present", "absent", "absent", "present"])]);
    expect(result.items).toMatchObject([{ kind: "returned", tone: "positive" }]);
  });

  it("flags a recurring registered visitor", () => {
    const result = run([student("vini", ["visitor", "present"], { status: "visitor" })]);
    expect(result.items).toMatchObject([{ kind: "recurring_visitor" }]);
  });

  it("groups pending roll calls and links the oldest", () => {
    const result = run([], [{ id: "b", title: "Ensaio", event_date: "2026-11-12" }, { id: "a", title: "EBD", event_date: "2026-11-08" }]);
    expect(result.items).toMatchObject([{ kind: "pending_records", title: "2 eventos sem registro", href: "/eventos/a" }]);
  });

  it("reports an attendance drop only with enough records", () => {
    const steady = ["present", "present", "present", "present"] as AttendanceStatus[];
    const group = [
      ...["a", "b", "c"].map((id) => student(id, ["absent", ...steady])),
      ...["d", "e", "f"].map((id) => student(id, ["present", ...steady])),
    ];
    const drop = run(group).items.find((item) => item.kind === "attendance_drop");
    expect(drop?.detail).toBe("50 p.p. abaixo das 4 anteriores (100%) · 3 faltaram pela primeira vez");

    const tiny = run([student("a", ["absent", ...steady]), student("b", ["present", ...steady])]);
    expect(tiny.items.some((item) => item.kind === "attendance_drop")).toBe(false);
  });

  it("caps the list and reports the total", () => {
    const many = Array.from({ length: 12 }, (_, index) => student(`s${index}`, ["absent", "absent"]));
    const result = run(many);
    expect(result.items).toHaveLength(8);
    expect(result.total).toBe(12);
  });
});
