import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { requireStaff } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { calculateAttendanceMetrics, type AttendanceStatus } from "@/services/attendance";
import { getRadarStatus } from "@/services/pastoral-radar";
import { ageOnDate, getStudentLifecycle } from "@/services/student-lifecycle";

type Row = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  birth_date: string;
  status: string;
  is_active: boolean;
};
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const registrationFilters = ["active", "visitor", "inactive", "archived"];
const radarFilters = ["attention", "follow_up", "priority"];

export default async function StudentsPage({ searchParams }: Props) {
  const actor = await requireStaff();
  const params = await searchParams;
  const search = typeof params.busca === "string" ? params.busca.slice(0, 80) : "";
  const filter = typeof params.filtro === "string" ? params.filtro : "all";
  const order = typeof params.ordem === "string" ? params.ordem : "name";
  const supabase = await createClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

  let query = supabase
    .from("students")
    .select("id,full_name,preferred_name,birth_date,status,is_active")
    .eq("ministry_id", actor.ministryId);
  if (search) query = query.ilike("full_name", `%${search}%`);
  if (registrationFilters.includes(filter)) query = query.eq("status", filter);
  else query = query.neq("status", "archived");

  const { data, error: studentsError } = await query.order("full_name");
  const rows = (data ?? []) as Row[];
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id,event_date")
    .eq("ministry_id", actor.ministryId)
    .eq("type", "EBD")
    .eq("status", "completed");
  const eventMap = new Map((events ?? []).map((event) => [event.id, event.event_date]));
  const { data: attendance, error: attendanceError } = events?.length
    ? await supabase
        .from("attendance")
        .select("student_id,event_id,attendance_status")
        .in("event_id", events.map((event) => event.id))
    : { data: [], error: null };

  let items = rows.map((student) => {
    const metrics = calculateAttendanceMetrics(
      (attendance ?? [])
        .filter((item) => item.student_id === student.id)
        .map((item) => ({
          eventDate: eventMap.get(item.event_id)!,
          status: item.attendance_status as AttendanceStatus,
        })),
    );
    return {
      ...student,
      metrics,
      radar: getRadarStatus(metrics.consecutiveAbsences, student.is_active),
      lifecycle: getStudentLifecycle(student.birth_date, today),
    };
  });

  if (radarFilters.includes(filter)) items = items.filter((item) => item.radar === filter);
  if (filter === "transition") items = items.filter((item) => ["transitioning", "transition_due"].includes(item.lifecycle));
  items.sort((a, b) =>
    order === "frequency"
      ? b.metrics.presenceRate - a.metrics.presenceRate
      : order === "last_presence"
        ? (b.metrics.lastPresence ?? "").localeCompare(a.metrics.lastPresence ?? "")
        : order === "status"
          ? a.radar.localeCompare(b.radar)
          : a.full_name.localeCompare(b.full_name, "pt-BR"),
  );

  const hasError = studentsError || eventsError || attendanceError;

  return (
    <>
      <PageHeading
        eyebrow="Cadastro"
        title="Adolescentes"
        description="Busca, status cadastral e indicadores de participação."
        action={<Link href="/adolescentes/novo" className="button-primary">Novo adolescente</Link>}
      />
      <form className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_210px_210px_auto]">
        <label className="sr-only" htmlFor="busca">Buscar por nome</label>
        <input className="input" id="busca" name="busca" placeholder="Buscar por nome" defaultValue={search} />
        <label className="sr-only" htmlFor="filtro">Filtrar</label>
        <select className="input" id="filtro" name="filtro" defaultValue={filter}>
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="visitor">Visitantes</option>
          <option value="attention">Atenção</option>
          <option value="follow_up">Acompanhamento</option>
          <option value="priority">Prioridade</option>
          <option value="transition">Transição para jovens</option>
          <option value="inactive">Inativos</option>
          <option value="archived">Arquivados</option>
        </select>
        <label className="sr-only" htmlFor="ordem">Ordenar</label>
        <select className="input" id="ordem" name="ordem" defaultValue={order}>
          <option value="name">Ordem: nome</option>
          <option value="frequency">Ordem: frequência</option>
          <option value="last_presence">Ordem: última presença</option>
          <option value="status">Ordem: status</option>
        </select>
        <button className="button-secondary">Aplicar</button>
      </form>

      {hasError ? (
        <section className="card p-10 text-center" role="alert">
          <h2 className="font-bold">Não foi possível carregar os adolescentes</h2>
          <p className="mt-2 text-sm text-[#647268]">Atualize a página e tente novamente.</p>
        </section>
      ) : items.length === 0 ? (
        <section className="card p-10 text-center">
          <h2 className="font-bold">Nenhum adolescente encontrado</h2>
          <p className="mt-2 text-sm text-[#647268]">Ajuste a busca ou cadastre o primeiro adolescente.</p>
        </section>
      ) : (
        <section className="grid gap-3">
          {items.map((student) => (
            <article className="card grid items-center gap-4 p-4 sm:grid-cols-[auto_1fr_repeat(4,minmax(90px,auto))]" key={student.id}>
              <div className="grid size-11 place-items-center rounded-full bg-[#e3efe7] font-black text-[#176b49]">
                {initials(student.full_name)}
              </div>
              <div>
                <Link className="font-bold hover:text-[#176b49]" href={`/adolescentes/${student.id}`}>
                  {student.preferred_name || student.full_name}
                </Link>
                <p className="text-sm text-[#647268]">{ageOnDate(student.birth_date, today)} anos</p>
                {student.lifecycle === "transitioning" && <span className="badge mt-2 bg-blue-50 text-blue-800">Em transição</span>}
                {student.lifecycle === "transition_due" && <span className="badge mt-2 bg-amber-50 text-amber-800">Revisar transição</span>}
              </div>
              <Metric label="Última presença" value={formatDate(student.metrics.lastPresence)} />
              <Metric label="Frequência" value={`${student.metrics.presenceRate}%`} />
              <Metric label="Ausências seguidas" value={String(student.metrics.consecutiveAbsences)} />
              <div><StatusBadge status={student.radar} /></div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-[#647268]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
