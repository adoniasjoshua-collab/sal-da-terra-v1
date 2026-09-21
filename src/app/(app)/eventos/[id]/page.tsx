import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { saveAttendance } from "@/features/events/actions";
import { HeadcountForm } from "@/features/events/headcount-form";
import { requireStaff } from "@/lib/auth";
import { formatDate, initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPE_LABELS, type EventType } from "@/services/events";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string; editado?: string }> };

export default async function AttendancePage({ params, searchParams }: Props) {
  const actor = await requireStaff();
  const { id } = await params;
  const query = await searchParams;
  const saved = query.salvo === "1";
  const edited = query.editado === "1";
  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,title,type,event_date,status,ministry_id,attendance_mode")
    .eq("id", id)
    .eq("ministry_id", actor.ministryId)
    .maybeSingle();
  if (eventError) throw new Error("Não foi possível carregar o evento.");
  if (!event) notFound();
  if (event.status === "cancelled") return <>
    <PageHeading eyebrow="Evento cancelado" title={event.title} description="Os registros de participação foram preservados. Reabra o evento para editar a chamada ou a contagem."
      action={<Link className="button-primary" href={`/eventos/${id}/editar`}>Editar evento e status</Link>} />
    <Link className="button-secondary" href="/eventos">Voltar aos eventos</Link>
  </>;

  if (event.attendance_mode === "headcount_only") {
    const { data: existing, error: countError } = await supabase
      .from("event_headcounts")
      .select("adolescent_count,visitor_count,is_estimated,notes")
      .eq("event_id", id)
      .maybeSingle();
    if (countError) throw new Error("Não foi possível carregar a contagem existente. Tente novamente antes de editar.");

    return (
      <>
        <PageHeading eyebrow="Contagem de participantes" title={event.title} description={`${EVENT_TYPE_LABELS[event.type as EventType]} · ${formatDate(event.event_date)}`} action={<Link className="button-secondary" href={`/eventos/${id}/editar`}>Editar evento</Link>} />
        {(saved || edited) && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700">{edited ? "Evento atualizado com sucesso." : "Evento e contagem registrados com sucesso."}</p>}
        <p className="mb-5 rounded-xl bg-[#edf7f1] p-4 text-sm leading-6 text-[#365747]">Este evento usa contagem coletiva. Nenhum adolescente será identificado e o resultado não afeta a frequência EBD nem o Radar Pastoral.</p>
        <HeadcountForm eventId={id} existing={existing} />
      </>
    );
  }

  const [{ data: activeStudents, error: studentsError }, { data: existing, error: attendanceError }] = await Promise.all([
    supabase.from("students").select("id,full_name,preferred_name,status").eq("ministry_id", actor.ministryId).eq("is_active", true).in("status", ["active", "visitor"]).order("full_name"),
    supabase.from("attendance").select("student_id,attendance_status").eq("event_id", id),
  ]);
  if (studentsError || attendanceError) throw new Error("Não foi possível carregar a chamada existente. Tente novamente antes de editar.");
  const missingIds = (existing ?? []).map((row) => row.student_id)
    .filter((studentId) => !activeStudents?.some((student) => student.id === studentId));
  const { data: historicalStudents, error: historyError } = missingIds.length
    ? await supabase.from("students").select("id,full_name,preferred_name,status")
      .eq("ministry_id", actor.ministryId).in("id", missingIds)
    : { data: [], error: null };
  if (historyError) throw new Error("Não foi possível carregar os participantes históricos.");
  const students = [...(activeStudents ?? []), ...(historicalStudents ?? [])]
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
  const current = new Map((existing ?? []).map((row) => [row.student_id, row.attendance_status]));
  const action = saveAttendance.bind(null, id);
  const fullRoster = event.attendance_mode === "full_roster";
  const options = fullRoster
    ? [["present", "Presente"], ["absent", "Ausente"], ["justified", "Justificada"], ["visitor", "Visitante"]]
    : [["present", "Participou"], ["visitor", "Visitante"], ["not_participated", "Não participou"]];

  return (
    <>
      <PageHeading eyebrow={fullRoster ? "Chamada" : "Participação identificada"} title={event.title} description={`${EVENT_TYPE_LABELS[event.type as EventType]} · ${formatDate(event.event_date)}`} action={<Link className="button-secondary" href={`/eventos/${id}/editar`}>Editar evento</Link>} />
      {edited && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700">Evento atualizado com sucesso.</p>}
      {!fullRoster && <p className="mb-5 rounded-xl bg-[#edf7f1] p-4 text-sm text-[#365747]">Este evento é opcional. “Não participou” não representa falta e não afeta a frequência EBD nem o Radar Pastoral.</p>}
      {saved && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700">Participação salva com sucesso.</p>}
      {!students?.length ? (
        <section className="card p-10 text-center"><h2 className="font-bold">Nenhum adolescente ativo</h2><p className="mt-2 text-sm text-[#647268]">Cadastre adolescentes antes de registrar a participação.</p></section>
      ) : (
        <form action={action}>
          <section className="grid gap-3">
            {students.map((student) => {
              const defaultStatus = current.get(student.id) ?? (fullRoster ? (student.status === "visitor" ? "visitor" : "absent") : "not_participated");
              return (
                <fieldset className="card p-4" key={student.id}>
                  <legend className="sr-only">Participação de {student.full_name}</legend>
                  <div className="flex items-center gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e3efe7] font-black text-[#176b49]">{initials(student.full_name)}</div><p className="min-w-0 flex-1 truncate font-bold">{student.preferred_name || student.full_name}</p></div>
                  <div className={`mt-4 grid gap-2 ${fullRoster ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                    {options.map(([value, label]) => <label className="cursor-pointer" key={value}><input className="peer sr-only" type="radio" name={`attendance:${student.id}`} value={value} defaultChecked={defaultStatus === value} required /><span className="flex min-h-12 items-center justify-center rounded-xl border border-[#cbd6cd] px-2 text-center text-xs font-bold peer-checked:border-[#176b49] peer-checked:bg-[#e8f4ec] peer-checked:text-[#176b49]">{label}</span></label>)}
                  </div>
                </fieldset>
              );
            })}
          </section>
          <div className="sticky bottom-4 mt-5 rounded-2xl bg-[#143d2c] p-3 shadow-xl"><button className="button-primary w-full bg-[#e6c861] text-[#19382b] hover:bg-[#f0d879]">Salvar participação</button></div>
        </form>
      )}
    </>
  );
}
