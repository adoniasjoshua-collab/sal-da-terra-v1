import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ATTENDANCE_MODE_LABELS, EVENT_TYPE_LABELS, type AttendanceMode, type EventType } from "@/services/events";

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
        action={<Link className="button-primary" href="/eventos/novo">Novo evento</Link>}
      />
      {error ? (
        <section className="card p-10 text-center" role="alert"><h2 className="font-bold">Não foi possível carregar os eventos</h2></section>
      ) : !events?.length ? (
        <section className="card p-10 text-center"><h2 className="font-bold">Nenhum evento criado</h2><p className="mt-2 text-sm text-[#647268]">Crie o primeiro evento para registrar participação.</p></section>
      ) : (
        <section className="grid gap-3">
          {events.map((event) => (
            <Link className="card flex items-center justify-between gap-4 p-5 hover:border-[#86ad96]" href={`/eventos/${event.id}`} key={event.id}>
              <div>
                <p className="font-bold">{event.title}</p>
                <p className="mt-1 text-sm text-[#647268]">
                  {EVENT_TYPE_LABELS[event.type as EventType]} · {formatDate(event.event_date)} {event.start_time && `· ${event.start_time.slice(0, 5)}`}
                </p>
                <p className="mt-1 text-xs text-[#7a877f]">{ATTENDANCE_MODE_LABELS[event.attendance_mode as AttendanceMode]}</p>
              </div>
              <span className="badge bg-[#edf7f1] text-[#176b49]">{event.status === "completed" ? "Registro salvo" : "Registrar"}</span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
