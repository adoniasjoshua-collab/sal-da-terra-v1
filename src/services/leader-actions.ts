import type { AttendanceStatus } from "./attendance";
import type { EbdSummary } from "./dashboard-metrics";
import { RADAR_THRESHOLDS, type RadarStatus } from "./pastoral-radar";

/**
 * Local, rule-based suggestions for the leader dashboard ("Ações da semana").
 * Every rule reads only observable participation data and the date of the last
 * follow-up — never follow-up content. Texts come from LEADER_ACTION_CATALOG,
 * which is pastoral copy and must be reviewed like any other content.
 */

export const LEADER_ACTION_RULES = Object.freeze({
  /** A follow-up within this window means the leader already acted. */
  recentContactDays: 7,
  /** Minimum drop (percentage points) of the last EBD against the previous four. */
  attendanceDropPoints: 15,
  /** Below this many considered records, a rate change is noise, not a signal. */
  minConsideredForRate: 5,
  /** A registered visitor attending this many of the last four EBDs is recurring. */
  recurringVisitorAttendances: 2,
  maxItems: 8,
});

export type LeaderActionKind = "radar_attention" | "radar_follow_up" | "radar_priority" | "pending_records" | "attendance_drop" | "recurring_visitor" | "returned";
export type LeaderActionTone = "high" | "medium" | "low" | "positive";

export const LEADER_ACTION_CATALOG: Record<LeaderActionKind, { tone: LeaderActionTone; label: string; action: string }> = {
  radar_priority: { tone: "high", label: "Prioridade", action: "Combine uma visita ou conversa com a família, junto com outro líder." },
  radar_follow_up: { tone: "medium", label: "Acompanhamento", action: "Ligue para o adolescente ou para o responsável." },
  radar_attention: { tone: "low", label: "Atenção", action: "Mande uma mensagem dizendo que sentiu falta dele." },
  pending_records: { tone: "medium", label: "Registro pendente", action: "Registre a participação para os indicadores ficarem completos." },
  attendance_drop: { tone: "medium", label: "Queda de presença", action: "Veja quem faltou pela primeira vez e mande uma mensagem ainda esta semana." },
  recurring_visitor: { tone: "low", label: "Visitante frequente", action: "Converse com ele e a família sobre fazer parte do grupo." },
  returned: { tone: "positive", label: "Voltou", action: "Agradeça a volta e acolha sem cobrar as faltas." },
};

const RADAR_ACTION_KIND: Partial<Record<RadarStatus, LeaderActionKind>> = {
  attention: "radar_attention", follow_up: "radar_follow_up", priority: "radar_priority",
};

const TONE_ORDER:Record<LeaderActionTone, number> = { high: 0, medium: 1, low: 2, positive: 3 };

export type LeaderActionStudent = {
  id: string;
  name: string;
  status: string;
  radar: RadarStatus;
  consecutiveAbsences: number;
  /** Completed EBD records, any order. */
  records: { eventDate: string; status: AttendanceStatus }[];
  /** Latest follow-up date (YYYY-MM-DD) or null. */
  lastContact: string | null;
};

export type LeaderActionInput = {
  today: string;
  students: LeaderActionStudent[];
  /** Completed EBDs, newest first. */
  summaries: EbdSummary[];
  pendingEvents: { id: string; title: string; event_date: string }[];
};

export type LeaderAction = {
  key: string;
  kind: LeaderActionKind;
  tone: LeaderActionTone;
  label: string;
  title: string;
  detail: string;
  action: string;
  href: string;
};

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function brDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

function make(kind: LeaderActionKind, key: string, title: string, detail: string, href: string): LeaderAction {
  const entry = LEADER_ACTION_CATALOG[kind];
  return { key, kind, tone: entry.tone, label: entry.label, title, detail, action: entry.action, href };
}

export function buildLeaderActions({ today, students, summaries, pendingEvents }: LeaderActionInput) {
  const rules = LEADER_ACTION_RULES;
  const actions: LeaderAction[] = [];
  const recentEbdDates = summaries.slice(0, 4).map((summary) => summary.date);

  for (const student of students) {
    const ordered = [...student.records].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    const contactedRecently = student.lastContact !== null && daysBetween(student.lastContact, today) <= rules.recentContactDays;
    const contactText = student.lastContact ? `Último contato: ${brDate(student.lastContact)}` : "Nenhum contato registrado";
    const href = `/adolescentes/${student.id}#acompanhamentos`;

    const radarKind = RADAR_ACTION_KIND[student.radar];
    if (radarKind && !contactedRecently) {
      actions.push(make(radarKind, `${radarKind}:${student.id}`, student.name, `${student.consecutiveAbsences} faltas seguidas na EBD · ${contactText}`, href));
      continue;
    }

    // Back after a streak that had reached the radar: worth a word of welcome.
    if (ordered[0]?.status === "present") {
      let previousAbsences = 0;
      for (const record of ordered.slice(1)) { if (record.status !== "absent") break; previousAbsences += 1; }
      if (previousAbsences >= RADAR_THRESHOLDS.attention && ordered[0].eventDate === summaries[0]?.date) {
        actions.push(make("returned", `returned:${student.id}`, student.name, `Voltou em ${brDate(ordered[0].eventDate)} depois de ${previousAbsences} faltas seguidas`, href));
        continue;
      }
    }

    if (student.status === "visitor") {
      const attended = ordered.filter((record) => recentEbdDates.includes(record.eventDate) && (record.status === "present" || record.status === "visitor")).length;
      if (attended >= rules.recurringVisitorAttendances) {
        actions.push(make("recurring_visitor", `recurring_visitor:${student.id}`, student.name, `Veio em ${attended} das últimas ${recentEbdDates.length} EBDs como visitante`, `/adolescentes/${student.id}`));
      }
    }
  }

  if (pendingEvents.length > 0) {
    const first = [...pendingEvents].sort((a, b) => a.event_date.localeCompare(b.event_date))[0];
    const title = pendingEvents.length === 1 ? first.title : `${pendingEvents.length} eventos sem registro`;
    actions.push(make("pending_records", "pending_records", title, `Mais antigo: ${first.title} · ${brDate(first.event_date)}`, `/eventos/${first.id}`));
  }

  const [last, ...rest] = summaries;
  const previous = rest.slice(0, 4);
  if (last && previous.length > 0 && last.present + last.absent >= rules.minConsideredForRate && last.operationalRate !== null) {
    const present = previous.reduce((sum, item) => sum + item.present, 0);
    const considered = previous.reduce((sum, item) => sum + item.present + item.absent, 0);
    if (considered >= rules.minConsideredForRate) {
      const previousRate = Math.round((present / considered) * 100);
      const drop = previousRate - last.operationalRate;
      if (drop >= rules.attendanceDropPoints) {
        const firstTime = students.filter((student) => student.consecutiveAbsences === 1 && student.records.some((record) => record.eventDate === last.date && record.status === "absent")).length;
        actions.push(make("attendance_drop", `attendance_drop:${last.id}`, `EBD de ${brDate(last.date)}: ${last.operationalRate}%`, `${drop} p.p. abaixo das 4 anteriores (${previousRate}%) · ${firstTime} faltaram pela primeira vez`, `/eventos/${last.id}`));
      }
    }
  }

  const sorted = actions.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
  return { items: sorted.slice(0, rules.maxItems), total: sorted.length };
}
