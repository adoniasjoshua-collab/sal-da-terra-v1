import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { EbdTrendChart, LastEbdDonut, RadarDistribution } from "@/features/dashboard/dashboard-charts";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { calculateAttendanceMetrics, type AttendanceStatus } from "@/services/attendance";
import { combinedOperationalRate, rateDelta, summarizeEbd, type DashboardAttendance } from "@/services/dashboard-metrics";
import { getRadarStatus, type RadarStatus } from "@/services/pastoral-radar";

type Student = { id: string; full_name: string; preferred_name: string | null; status: string; is_active: boolean };
type Event = { id: string; event_date: string; title: string };
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
    supabase.from("events").select("id,event_date,title").eq("ministry_id", actor.ministryId).eq("type", "EBD").eq("status", "completed").order("event_date", { ascending: false }),
    supabase.from("pastoral_followups").select("id", { count: "exact", head: true }).eq("ministry_id", actor.ministryId).eq("status", "open"),
  ]);

  if (studentsResult.error || eventsResult.error) throw new Error("Não foi possível carregar os indicadores do ministério.");

  const students = (studentsResult.data ?? []) as Student[];
  const events = (eventsResult.data ?? []) as Event[];
  const attendanceResult = events.length
    ? await supabase.from("attendance").select("student_id,event_id,attendance_status").in("event_id", events.map((event) => event.id))
    : { data: [], error: null };

  if (attendanceResult.error) throw new Error("Não foi possível carregar a frequência da EBD.");

  const attendance = (attendanceResult.data ?? []) as Attendance[];
  const eventDates = new Map(events.map((event) => [event.id, event.event_date]));
  const summaries = events.slice(0, 12).map((event) => summarizeEbd(event, attendance));
  const last = summaries[0];
  const recentRate = combinedOperationalRate(summaries.slice(0, 4));
  const previousRate = combinedOperationalRate(summaries.slice(4, 8));
  const delta = rateDelta(recentRate, previousRate);

  const enriched = students.map((student) => {
    const metrics = calculateAttendanceMetrics(
      attendance
        .filter((row) => row.student_id === student.id)
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

      <p className="mt-5 text-xs leading-5 text-[#647268]">Comparecimento operacional: presentes ÷ (presentes + ausentes). Justificativas e visitantes são exibidos separadamente e não reduzem esse percentual.</p>
    </>
  );
}
