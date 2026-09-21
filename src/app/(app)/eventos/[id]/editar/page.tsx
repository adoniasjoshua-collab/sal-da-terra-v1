import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { EventForm } from "@/features/events/event-form";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceMode, EventType } from "@/services/events";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: event, error: eventError }, { count: attendanceCount, error: attendanceError }, { count: headcountCount, error: headcountError }] = await Promise.all([
    supabase.from("events").select("id,title,type,attendance_mode,event_date,start_time,description,status").eq("id", id).eq("ministry_id", actor.ministryId).maybeSingle(),
    supabase.from("attendance").select("id", { count: "exact", head: true }).eq("event_id", id),
    supabase.from("event_headcounts").select("id", { count: "exact", head: true }).eq("event_id", id),
  ]);
  if (eventError || attendanceError || headcountError) throw new Error("Não foi possível carregar o evento para edição.");
  if (!event) notFound();

  return (
    <>
      <PageHeading eyebrow="Eventos" title="Editar evento" description="Atualize as informações gerais sem perder o histórico já registrado." />
      <EventForm
        event={{ ...event, type: event.type as EventType, attendance_mode: event.attendance_mode as AttendanceMode }}
        participationLocked={(attendanceCount ?? 0) > 0 || (headcountCount ?? 0) > 0}
      />
    </>
  );
}
