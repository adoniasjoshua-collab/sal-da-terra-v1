import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { EbdTrendChart, EventParticipationChart, LastEbdDonut, RadarDistribution } from "@/features/dashboard/dashboard-charts";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { calculateAttendanceMetrics, type AttendanceStatus } from "@/services/attendance";
import { combinedOperationalRate, rateDelta, summarizeEbd, type DashboardAttendance } from "@/services/dashboard-metrics";
import { buildEventDashboard, type EventDashboardHeadcount } from "@/services/event-dashboard";
import { EVENT_TYPE_LABELS } from "@/services/events";
import { getRadarStatus, type RadarStatus } from "@/services/pastoral-radar";
import type { AttendanceMode, EventStatus, EventType } from "@/types/database";

type Student = { id: string; full_name: string; preferred_name: string | null; status: string; is_active: boolean };
type Event = { id: string; event_date: string; title: string; type: EventType; status: EventStatus; attendance_mode: AttendanceMode };
type Attendance = DashboardAttendance & { student_id: string };

function formatRate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function formatDelta(value: number | null) {
  if (value === null) return "Comparação ainda indisponível";
  if (value === 0) return "Estável frente às 4 anteriores";
  return `${value > 0 ? "+" : ""}${value} p.p. frente às 4 anteriores`;
}

export default async function DashboardPage() {
  const actor = await requireStaff();
  const supabase = await createClient();
  const [studentsResult, eventsResult, followupsResult] = await Promise.all([
    supabase.from("students").select("id,full_name,preferred_name,status,is_active").eq("ministry_id", actor.ministryId).neq("status", "archived"),
    supabase.from("events").select("id,event_date,title,type,status,attendance_mode").eq("ministry_id", actor.ministryId).order("event_date", { ascending: false }),
    supabase.from("pastoral_followups").select("id", { count: "exact", head: true }).eq("ministry_id", actor.ministryId).eq("status", "open"),
  ]);

  if (studentsResult.error || eventsResult.error) throw new Error("Não foi possível carregar os indicadores do ministério.");

  const students = (studentsResult.data ?? []) as Student[];
  const allEvents = (eventsResult.data ?? []) as Event[];
  const events = allEvents.filter((event) => event.type === "EBD" && event.status === "completed");
  const [attendanceResult, headcountsResult] = allEvents.length
    ? await Promise.all([
        supabase.from("attendance").select("student_id,event_id,attendance_status").in("event_id", allEvents.map((event) => event.id)),
        supabase.from("event_headcounts").select("event_id,adolescent_count,visitor_count,is_estimated").in("event_id", allEvents.map((event) => event.id)),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (attendanceResult.error || headcountsResult.error) throw new Error("Não foi possível carregar os indicadores de participação.");

  const attendance = (attendanceResult.data ?? []) as Attendance[];
  const headcounts = (headcountsResult.data ?? []) as EventDashboardHeadcount[];
  const eventDates = new Map(events.map((event) => [event.id, event.event_date]));
  const ebdEventIds = new Set(events.map((event) => event.id));
  const summaries = events.slice(0, 12).map((event) => summarizeEbd(event, attendance));
  const last = summaries[0];
  const recentRate = combinedOperationalRate(summaries.slice(0, 4));
  const previousRate = combinedOperationalRate(summaries.slice(4, 8));
  const delta = rateDelta(recentRate, previousRate);

  const enriched = students.map((student) => {
    const metrics = calculateAttendanceMetrics(
      attendance
        .filter((row) => row.student_id === student.id && ebdEventIds.has(row.event_id))
        .map((row) => ({ eventDate: eventDates.get(row.event_id)!, status: row.attendance_status as AttendanceStatus })),
    );
    const participates = student.is_active && student.status !== "inactive";
    return { ...student, metrics, radar: getRadarStatus(metrics.consecutiveAbsences, participates) };
  });

  const radarCounts: Record<RadarStatus, number> = { active: 0, attention: 0, follow_up: 0, priority: 0, inactive: 0 };
  enriched.forEach((student) => { radarCounts[student.radar] += 1; });
  const attention = enriched
    .filter((student) => ["attention", "follow_up", "priority"].includes(student.radar))
    .sort((a, b) => b.metrics.consecutiveAbsences - a.metrics.consecutiveAbsences);
  const attentionTotal = radarCounts.attention + radarCounts.follow_up + radarCounts.priority;
  const lastConsidered = last ? last.present + last.absent : 0;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const eventDashboard = buildEventDashboard(allEvents, attendance, headcounts, today);
  const eventAgenda = [
    ...eventDashboard.pending.map((event) => ({ ...event, operationalStatus: "Registro pendente" })),
    ...eventDashboard.upcoming.map((event) => ({ ...event, operationalStatus: "Próximo evento" })),
  ].slice(0, 6);

  const cards = [
    { label: "Adolescentes", value: students.length, detail: "Cadastros não arquivados" },
    { label: "Ativos", value: students.filter((student) => student.status === "active").length, detail: `${students.filter((student) => student.status === "visitor").length} visitantes` },
    { label: "Última EBD", value: formatRate(last?.operationalRate ?? null), detail: last ? `${last.present} presentes de ${lastConsidered} considerados` : "Sem EBD concluída" },
    { label: "Média · 4 EBDs", value: formatRate(recentRate), detail: formatDelta(delta) },
    { label: "Precisam de atenção", value: attentionTotal, detail: `${radarCounts.priority} em prioridade` },
    { label: "Acompanhamentos", value: followupsResult.error ? "—" : (followupsResult.count ?? 0), detail: followupsResult.error ? "Indicador indisponível" : "Ações em aberto" },
  ];

  return (
    <>
      <PageHeading eyebrow="Painel do líder" title="Visão do ministério" description="Indicadores observáveis para acompanhar participação e organizar o cuidado." action={<Link href="/eventos/novo" className="button-primary">Novo evento</Link>} />
      <p className="mb-6 rounded-xl border border-[#d7e6dc] bg-[#edf7f1] p-4 text-sm text-[#365747]">Indicadores servem para apoiar o cuidado pastoral e não representam uma avaliação da fé ou espiritualidade do adolescente.</p>

      <section aria-label="Indicadores principais" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <article className="card p-5" key={card.label}><p className="text-sm font-semibold text-[#647268]">{card.label}</p><p className="mt-2 text-3xl font-black tabular-nums">{card.value}</p><p className="mt-2 text-xs text-[#647268]">{card.detail}</p></article>)}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <section className="card p-5 sm:p-6" aria-labelledby="trend-title">
          <h2 id="trend-title" className="text-xl font-black">Evolução da EBD</h2>
          <EbdTrendChart summaries={summaries} />
        </section>
        <section className="card p-5 sm:p-6" aria-labelledby="last-title">
          <h2 id="last-title" className="text-xl font-black">Última EBD</h2>
          <LastEbdDonut summary={last} />
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(300px,.6fr)_minmax(0,1.4fr)]">
        <section className="card p-5 sm:p-6" aria-labelledby="radar-title">
          <h2 id="radar-title" className="text-xl font-black">Radar Pastoral</h2>
          <p className="mt-1 text-sm text-[#647268]">Distribuição por necessidade operacional de cuidado.</p>
          <RadarDistribution counts={radarCounts} />
        </section>
        <section className="card p-5 sm:p-6" aria-labelledby="attention-title">
          <div className="mb-5 flex items-center justify-between gap-3"><h2 id="attention-title" className="text-xl font-black">Fila de cuidado</h2><Link href="/adolescentes?filtro=attention" className="text-sm font-bold text-[#176b49]">Ver todos</Link></div>
          {attention.length === 0 ? <p className="py-8 text-center text-[#647268]">Nenhum alerta de ausência consecutiva.</p> : (
            <div className="divide-y divide-[#e7ece8]">{attention.slice(0, 6).map((student) => <article className="flex flex-wrap items-center justify-between gap-3 py-4" key={student.id}><div><Link className="font-bold hover:text-[#176b49]" href={`/adolescentes/${student.id}`}>{student.preferred_name || student.full_name}</Link><p className="mt-1 text-sm text-[#647268]">{student.metrics.consecutiveAbsences} ausências consecutivas · Última presença: {formatDate(student.metrics.lastPresence)}</p></div><StatusBadge status={student.radar} /></article>)}</div>
          )}
        </section>
      </div>

      <section className="mt-10" aria-labelledby="events-overview-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-black uppercase tracking-[.16em] text-[#3f7cac]">Outros eventos</p><h2 id="events-overview-title" className="text-2xl font-black">Eventos e participação</h2><p className="mt-1 text-sm text-[#647268]">Volume dos últimos 90 dias, separado da frequência EBD.</p></div><Link href="/eventos" className="button-secondary">Gerenciar eventos</Link></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article className="card p-5"><p className="text-sm font-semibold text-[#647268]">Eventos realizados</p><p className="mt-2 text-3xl font-black tabular-nums">{eventDashboard.completed.length}</p><p className="mt-2 text-xs text-[#647268]">Concluídos nos últimos 90 dias</p></article>
          <article className="card p-5"><p className="text-sm font-semibold text-[#647268]">Participações</p><p className="mt-2 text-3xl font-black tabular-nums">{eventDashboard.participationTotal}</p><p className="mt-2 text-xs text-[#647268]">Soma das presenças e contagens</p></article>
          <article className="card p-5"><p className="text-sm font-semibold text-[#647268]">Pessoas identificadas</p><p className="mt-2 text-3xl font-black tabular-nums">{eventDashboard.identifiedUnique}</p><p className="mt-2 text-xs text-[#647268]">Únicas, somente em eventos por nome</p></article>
          <article className="card p-5"><p className="text-sm font-semibold text-[#647268]">Próximos 30 dias</p><p className="mt-2 text-3xl font-black tabular-nums">{eventDashboard.upcoming.length}</p><p className="mt-2 text-xs text-[#647268]">Planejados ou abertos</p></article>
          <article className="card p-5"><p className="text-sm font-semibold text-[#647268]">Registros pendentes</p><p className="mt-2 text-3xl font-black tabular-nums">{eventDashboard.pending.length}</p><p className="mt-2 text-xs text-[#647268]">Eventos passados ainda não concluídos</p></article>
          <article className="card p-5"><p className="text-sm font-semibold text-[#647268]">Contagens estimadas</p><p className="mt-2 text-3xl font-black tabular-nums">{eventDashboard.estimatedCount}</p><p className="mt-2 text-xs text-[#647268]">Sinalizadas com transparência</p></article>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
          <section className="card p-5 sm:p-6" aria-labelledby="event-category-title"><h3 id="event-category-title" className="text-xl font-black">Participação por categoria</h3><p className="mt-1 text-sm text-[#647268]">Participações, não pessoas únicas · últimos 90 dias</p><EventParticipationChart categories={eventDashboard.categories} /></section>
          <section className="card p-5 sm:p-6" aria-labelledby="event-agenda-title"><h3 id="event-agenda-title" className="text-xl font-black">Agenda operacional</h3><p className="mt-1 text-sm text-[#647268]">Prioriza registros atrasados e próximos eventos.</p>{eventAgenda.length === 0 ? <p className="py-10 text-center text-sm text-[#647268]">Nenhuma pendência ou evento nos próximos 30 dias.</p> : <div className="mt-4 divide-y divide-[#e7ece8]">{eventAgenda.map((event) => <article className="py-4" key={event.id}><div className="flex items-start justify-between gap-3"><div><Link className="font-bold hover:text-[#176b49]" href={`/eventos/${event.id}`}>{event.title}</Link><p className="mt-1 text-xs text-[#647268]">{EVENT_TYPE_LABELS[event.type]} · {formatDate(event.event_date)}</p></div><span className={`badge ${event.operationalStatus === "Registro pendente" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"}`}>{event.operationalStatus}</span></div></article>)}</div>}</section>
        </div>
      </section>

      <p className="mt-5 text-xs leading-5 text-[#647268]">Comparecimento operacional: presentes ÷ (presentes + ausentes). Justificativas e visitantes são exibidos separadamente e não reduzem esse percentual.</p>
    </>
  );
}
