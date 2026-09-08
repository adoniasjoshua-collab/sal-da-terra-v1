import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { ReportActions } from "@/features/reports/report-actions";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { calculateAttendanceMetrics, type AttendanceStatus } from "@/services/attendance";
import { calculateOperationalRate } from "@/services/dashboard-metrics";
import { participationForEvent, type EventDashboardAttendance, type EventDashboardEvent, type EventDashboardHeadcount } from "@/services/event-dashboard";
import { EVENT_TYPE_LABELS } from "@/services/events";
import type { EventType, ReportSignatoryRow } from "@/types/database";

type SearchParams = Promise<{ inicio?: string; fim?: string }>;
type Student = { id: string; full_name: string; status: string; is_active: boolean };
type Attendance = EventDashboardAttendance;
type Event = EventDashboardEvent;

function safePeriod(startInput: string | undefined, endInput: string | undefined, today: string) {
  const valid = /^\d{4}-\d{2}-\d{2}$/;
  const defaultStart = `${today.slice(0, 7)}-01`;
  const start = startInput && valid.test(startInput) ? startInput : defaultStart;
  const end = endInput && valid.test(endInput) ? endInput : today;
  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;
  return days >= 0 && days <= 366 ? { start, end } : { start: defaultStart, end: today };
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireStaff();
  const params = await searchParams;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const period = safePeriod(params.inicio, params.fim, today);
  const supabase = await createClient();
  const [studentsResult, eventsResult, ministryResult, signatoriesResult] = await Promise.all([
    supabase.from("students").select("id,full_name,status,is_active").eq("ministry_id", actor.ministryId).neq("status", "archived").order("full_name"),
    supabase.from("events").select("id,title,type,event_date,status,attendance_mode").eq("ministry_id", actor.ministryId).eq("status", "completed").gte("event_date", period.start).lte("event_date", period.end).order("event_date"),
    supabase.from("ministries").select("name,churches(name)").eq("id", actor.ministryId).single(),
    supabase.from("report_signatories").select("*").eq("ministry_id", actor.ministryId).eq("is_active", true).order("display_order"),
  ]);
  if (studentsResult.error || eventsResult.error || ministryResult.error || signatoriesResult.error) throw new Error("Não foi possível gerar o relatório.");

  const students = (studentsResult.data ?? []) as Student[];
  const events = (eventsResult.data ?? []) as unknown as Event[];
  const eventIds = events.map((event) => event.id);
  const [attendanceResult, headcountsResult] = eventIds.length ? await Promise.all([
    supabase.from("attendance").select("event_id,student_id,attendance_status").in("event_id", eventIds),
    supabase.from("event_headcounts").select("event_id,adolescent_count,visitor_count,is_estimated").in("event_id", eventIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (attendanceResult.error || headcountsResult.error) throw new Error("Não foi possível reunir os registros do período.");

  const attendance = (attendanceResult.data ?? []) as Attendance[];
  const headcounts = (headcountsResult.data ?? []) as EventDashboardHeadcount[];
  const ebdEvents = events.filter((event) => event.type === "EBD");
  const ebdIds = new Set(ebdEvents.map((event) => event.id));
  const ebdRows = attendance.filter((row) => ebdIds.has(row.event_id));
  const countStatus = (status: AttendanceStatus) => ebdRows.filter((row) => row.attendance_status === status).length;
  const present = countStatus("present");
  const absent = countStatus("absent");
  const justified = countStatus("justified");
  const visitors = countStatus("visitor");
  const studentRows = students.map((student) => {
    const metrics = calculateAttendanceMetrics(ebdRows.filter((row) => row.student_id === student.id).map((row) => ({ eventDate: events.find((event) => event.id === row.event_id)?.event_date ?? period.start, status: row.attendance_status as AttendanceStatus })));
    return { ...student, metrics };
  });
  const otherEvents = events.filter((event) => event.type !== "EBD").map((event) => ({ ...event, participation: participationForEvent(event, attendance, headcounts) }));
  const church = ministryResult.data.churches as unknown as { name: string } | null;
  const signatories = (signatoriesResult.data ?? []) as ReportSignatoryRow[];
  const rate = calculateOperationalRate(present, absent);
  const generatedAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date());
  const summary = `${church?.name ?? "Igreja"} — ${actor.ministryName}\nPeríodo: ${formatDate(period.start)} a ${formatDate(period.end)}\nAdolescentes ativos: ${students.filter((student) => student.is_active && student.status === "active").length}\nEBDs realizadas: ${ebdEvents.length}\nPresenças EBD: ${present}\nFrequência operacional: ${rate === null ? "indisponível" : `${rate}%`}\nOutros eventos: ${otherEvents.length}`;

  return <>
    <div className="no-print"><PageHeading eyebrow="Gestão" title="Relatórios" description="Gere um documento operacional, imprima ou salve em PDF e prepare o envio por e-mail." /></div>
    <form method="get" className="no-print card mb-6 grid gap-4 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div><label className="label" htmlFor="inicio">Data inicial</label><input className="input" id="inicio" name="inicio" type="date" defaultValue={period.start} required /></div>
      <div><label className="label" htmlFor="fim">Data final</label><input className="input" id="fim" name="fim" type="date" defaultValue={period.end} required /></div>
      <button className="button-secondary">Gerar relatório</button>
      <p className="text-xs text-[#647268] sm:col-span-3">Período máximo: 366 dias. Acompanhamentos pastorais, contatos de responsáveis e observações privadas nunca entram neste relatório.</p>
    </form>
    <ReportActions subject={`Relatório SAL DA TERRA — ${formatDate(period.start)} a ${formatDate(period.end)}`} summary={summary} signatories={signatories} />

    <article className="report-sheet card p-6 sm:p-10">
      <header className="border-b-2 border-[#176b49] pb-5"><p className="text-xs font-black tracking-[.18em] text-[#176b49]">SAL DA TERRA</p><h1 className="mt-2 text-3xl font-black">Relatório operacional do ministério</h1><p className="mt-2 font-semibold">{church?.name ?? "Igreja"} · {actor.ministryName}</p><p className="mt-1 text-sm text-[#647268]">Período: {formatDate(period.start)} a {formatDate(period.end)} · Gerado em {generatedAt}</p></header>
      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo"><ReportMetric label="Adolescentes ativos" value={students.filter((student) => student.is_active && student.status === "active").length} /><ReportMetric label="EBDs realizadas" value={ebdEvents.length} /><ReportMetric label="Frequência operacional" value={rate === null ? "—" : `${rate}%`} /><ReportMetric label="Presenças" value={present} /><ReportMetric label="Ausências" value={absent} /><ReportMetric label="Justificadas · visitantes" value={`${justified} · ${visitors}`} /></section>
      <section className="mt-8"><h2 className="text-xl font-black">Frequência individual na EBD</h2><p className="mt-1 text-sm text-[#647268]">Uso interno da liderança autorizada.</p><div className="mt-4 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b"><th className="py-2 pr-3">Adolescente</th><th>Presenças</th><th>Ausências</th><th>Justificadas</th><th>Frequência</th></tr></thead><tbody>{studentRows.map((student) => <tr className="border-b border-[#edf1ed]" key={student.id}><td className="py-2 pr-3 font-semibold">{student.full_name}</td><td>{student.metrics.present}</td><td>{student.metrics.absent}</td><td>{student.metrics.justified}</td><td>{student.metrics.presenceRate}%</td></tr>)}</tbody></table></div></section>
      <section className="mt-8"><h2 className="text-xl font-black">Outros eventos realizados</h2>{otherEvents.length === 0 ? <p className="mt-3 text-sm text-[#647268]">Nenhum outro evento concluído no período.</p> : <div className="mt-3 divide-y">{otherEvents.map((event) => <div className="flex justify-between gap-4 py-3 text-sm" key={event.id}><div><p className="font-semibold">{event.title}</p><p className="text-[#647268]">{EVENT_TYPE_LABELS[event.type as EventType]} · {formatDate(event.event_date)}</p></div><p className="font-bold">{event.participation} participações</p></div>)}</div>}</section>
      <footer className="mt-14 border-t pt-8"><div className="grid gap-10 sm:grid-cols-2">{signatories.map((signatory) => <div className="pt-8 text-center" key={signatory.id}><div className="mx-auto mb-2 w-52 border-t border-[#17231d]" /><p className="font-bold">{signatory.full_name}</p><p className="text-sm">{signatory.role_title}</p>{signatory.phone && <p className="mt-1 text-xs">Celular: {signatory.phone}</p>}{signatory.email && <p className="text-xs">E-mail: {signatory.email}</p>}</div>)}</div>{signatories.length === 0 && <p className="text-center text-sm text-[#647268]">Assinaturas ainda não configuradas. <Link className="no-print font-bold text-[#176b49]" href="/administracao">Configurar no Admin</Link></p>}<p className="mt-8 text-center text-xs text-[#647268]">Indicadores operacionais de participação; não representam avaliação de fé ou espiritualidade.</p></footer>
    </article>
  </>;
}

function ReportMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-[#dfe6df] p-4"><p className="text-xs text-[#647268]">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>; }
