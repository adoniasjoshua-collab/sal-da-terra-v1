import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { EVENT_STATUS_LABELS, ATTENDANCE_MODE_LABELS, EVENT_TYPE_LABELS, type AttendanceMode, type EventType } from "@/services/events";

export default async function EventsPage() {
  const actor = await requireStaff();
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id,title,event_date,start_time,status,type,attendance_mode")
    .eq("ministry_id", actor.ministryId)
    .order("event_date", { ascending: false });

  return (
    <>
      <PageHeading
        eyebrow="Agenda"
        title="Eventos e participação"
        description="Registre EBD, cultos, missão, serviço e convivência sem misturar seus indicadores."
        action={<div className="flex flex-wrap gap-2"><Link className="button-secondary" href="/eventos/novo">Programar evento</Link><Link className="button-primary" href="/eventos/registrar">Registrar evento realizado</Link></div>}
      />
      {error ? (
        <section className="card p-10 text-center" role="alert"><h2 className="font-bold">Não foi possível carregar os eventos</h2></section>
      ) : !events?.length ? (
        <section className="card p-10 text-center"><h2 className="font-bold">Nenhum evento criado</h2><p className="mt-2 text-sm text-[#647268]">Crie o primeiro evento para registrar participação.</p></section>
      ) : (
        <section className="grid gap-3">
          {events.map((event) => (
            <article className="card flex flex-wrap items-center justify-between gap-4 p-5" key={event.id}>
              <div>
                <Link className="font-bold hover:text-[#176b49]" href={`/eventos/${event.id}`}>{event.title}</Link>
                <p className="mt-1 text-sm text-[#647268]">
                  {EVENT_TYPE_LABELS[event.type as EventType]} · {formatDate(event.event_date)} {event.start_time && `· ${event.start_time.slice(0, 5)}`}
                </p>
                <p className="mt-1 text-xs text-[#7a877f]">{ATTENDANCE_MODE_LABELS[event.attendance_mode as AttendanceMode]}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2"><span className="badge bg-[#edf7f1] text-[#176b49]">{EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS]}</span><Link className="button-secondary" href={`/eventos/${event.id}/editar`}>Editar evento e status</Link><Link className="button-secondary" href={`/eventos/${event.id}`}>Ver participação</Link></div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
