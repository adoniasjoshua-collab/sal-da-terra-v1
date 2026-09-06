"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPE_VALUES } from "@/services/events";

export type EventState = { error?: string } | undefined;
const eventSchema = z.object({
  title: z.string().trim().min(2).max(160),
  type: z.enum(EVENT_TYPE_VALUES),
  attendance_mode: z.enum(["full_roster", "participation_only"]),
  event_date: z.iso.date(),
  start_time: z.string().optional(),
  description: z.string().trim().max(1000).optional(),
});

export async function createEvent(_: EventState, formData: FormData): Promise<EventState> {
  const actor = await requireStaff();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados do evento." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...parsed.data,
      start_time: parsed.data.start_time || null,
      description: parsed.data.description || null,
      status: "planned",
      ministry_id: actor.ministryId,
      created_by: actor.userId,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível criar o evento." };
  revalidatePath("/eventos");
  redirect(`/eventos/${data.id}`);
}

const attendanceSchema = z.object({
  studentId: z.uuid(),
  status: z.enum(["present", "absent", "justified", "visitor", "not_participated"]),
});

export async function saveAttendance(eventId: string, formData: FormData) {
  const actor = await requireStaff();
  if (!z.uuid().safeParse(eventId).success) throw new Error("Evento inválido.");

  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,ministry_id")
    .eq("id", eventId)
    .eq("ministry_id", actor.ministryId)
    .maybeSingle();
  if (eventError || !event) throw new Error("Evento não encontrado ou acesso negado.");

  const parsedRows = [...formData.entries()]
    .filter(([key]) => key.startsWith("attendance:"))
    .map(([key, value]) => attendanceSchema.safeParse({ studentId: key.slice(11), status: value }));
  if (parsedRows.some((item) => !item.success)) throw new Error("A chamada contém dados inválidos.");

  const rows = parsedRows
    .filter((item) => item.success)
    .map((item) => ({
      ministry_id: actor.ministryId,
      event_id: eventId,
      student_id: item.data.studentId,
      attendance_status: item.data.status,
      registered_by: actor.userId,
    }));
  if (!rows.length) throw new Error("Nenhum adolescente foi incluído no registro.");

  const { error: attendanceError } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "event_id,student_id" });
  if (attendanceError) throw new Error("Não foi possível salvar a participação.");

  const { data: completed, error: completionError } = await supabase
    .from("events")
    .update({ status: "completed" })
    .eq("id", eventId)
    .eq("ministry_id", actor.ministryId)
    .select("id")
    .maybeSingle();
  if (completionError || !completed) throw new Error("Participação salva, mas o evento não pôde ser concluído.");

  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  revalidatePath("/adolescentes");
  redirect(`/eventos/${eventId}?salvo=1`);
}
