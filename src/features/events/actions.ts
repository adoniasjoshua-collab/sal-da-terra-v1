"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPE_VALUES, isAttendanceStatusAllowed, type AttendanceMode } from "@/services/events";

export type EventState = { error?: string } | undefined;
const eventSchema = z.object({
  title: z.string().trim().min(2).max(160),
  type: z.enum(EVENT_TYPE_VALUES),
  attendance_mode: z.enum(["full_roster", "participation_only", "headcount_only"]),
  event_date: z.iso.date(),
  start_time: z.string().optional(),
  description: z.string().trim().max(1000).optional(),
}).refine((event) => event.type !== "EBD" || event.attendance_mode === "full_roster", {
  message: "A EBD exige chamada completa.",
  path: ["attendance_mode"],
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

export async function updateEvent(id: string, _: EventState, formData: FormData): Promise<EventState> {
  const actor = await requireStaff();
  const parsedId = z.uuid().safeParse(id);
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success || !parsed.success) return { error: "Revise os dados do evento." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({ ...parsed.data, start_time: parsed.data.start_time || null, description: parsed.data.description || null })
    .eq("id", parsedId.data)
    .eq("ministry_id", actor.ministryId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: error?.message.includes("cannot change after records exist") ? "O tipo de registro não pode mudar depois que a participação foi salva." : "Não foi possível atualizar o evento." };
  revalidatePath(`/eventos/${parsedId.data}`);
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  redirect(`/eventos/${parsedId.data}?editado=1`);
}

const completedHeadcountEventSchema = eventSchema.and(z.object({
  adolescent_count: z.coerce.number().int().min(0).max(100000),
  visitor_count: z.coerce.number().int().min(0).max(100000),
  is_estimated: z.enum(["on"]).optional(),
  notes: z.string().trim().max(500).optional(),
})).refine((data) => data.type !== "EBD" && data.attendance_mode === "headcount_only", {
  message: "Use a chamada completa para a EBD.",
}).refine((data) => data.visitor_count <= data.adolescent_count, {
  message: "Visitantes não podem superar o total de adolescentes.",
});

export async function registerCompletedHeadcountEvent(_: EventState, formData: FormData): Promise<EventState> {
  const actor = await requireStaff();
  const parsed = completedHeadcountEventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados do evento." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_completed_headcount_event", {
    target_ministry: actor.ministryId,
    event_title: parsed.data.title,
    event_kind: parsed.data.type,
    occurred_on: parsed.data.event_date,
    began_at: parsed.data.start_time || null,
    event_description: parsed.data.description || null,
    total_adolescents: parsed.data.adolescent_count,
    total_visitors: parsed.data.visitor_count,
    count_is_estimated: parsed.data.is_estimated === "on",
    count_notes: parsed.data.notes || null,
  });
  if (error || !data) return { error: "Não foi possível registrar o evento realizado." };

  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  redirect(`/eventos/${data}?salvo=1`);
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
    .select("id,ministry_id,attendance_mode")
    .eq("id", eventId)
    .eq("ministry_id", actor.ministryId)
    .maybeSingle();
  if (eventError || !event) throw new Error("Evento não encontrado ou acesso negado.");

  const parsedRows = [...formData.entries()]
    .filter(([key]) => key.startsWith("attendance:"))
    .map(([key, value]) => attendanceSchema.safeParse({ studentId: key.slice(11), status: value }));
  if (parsedRows.some((item) => !item.success)) throw new Error("A chamada contém dados inválidos.");
  if (parsedRows.some((item) => item.success && !isAttendanceStatusAllowed(event.attendance_mode as AttendanceMode, item.data.status))) {
    throw new Error("Um estado de participação não corresponde ao tipo de chamada.");
  }

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

export type HeadcountState = { error?: string; success?: string } | undefined;
const headcountSchema = z.object({
  adolescent_count: z.coerce.number().int().min(0).max(100000),
  visitor_count: z.coerce.number().int().min(0).max(100000),
  is_estimated: z.enum(["on"]).optional(),
  notes: z.string().trim().max(500).optional(),
}).refine((data) => data.visitor_count <= data.adolescent_count, {
  message: "Visitantes não podem superar o total de adolescentes.",
  path: ["visitor_count"],
});

export async function saveHeadcount(
  eventId: string,
  _: HeadcountState,
  formData: FormData,
): Promise<HeadcountState> {
  const actor = await requireStaff();
  if (!z.uuid().safeParse(eventId).success) return { error: "Evento inválido." };
  const parsed = headcountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise a contagem." };

  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,attendance_mode")
    .eq("id", eventId)
    .eq("ministry_id", actor.ministryId)
    .maybeSingle();
  if (eventError || !event) return { error: "Evento não encontrado ou acesso negado." };
  if (event.attendance_mode !== "headcount_only") return { error: "Este evento exige registro individual." };

  const { error: countError } = await supabase.from("event_headcounts").upsert({
    ministry_id: actor.ministryId,
    event_id: eventId,
    adolescent_count: parsed.data.adolescent_count,
    visitor_count: parsed.data.visitor_count,
    is_estimated: parsed.data.is_estimated === "on",
    notes: parsed.data.notes || null,
    registered_by: actor.userId,
  }, { onConflict: "event_id" });
  if (countError) return { error: "Não foi possível salvar a contagem." };

  const { data: completed, error: completionError } = await supabase
    .from("events")
    .update({ status: "completed" })
    .eq("id", eventId)
    .eq("ministry_id", actor.ministryId)
    .select("id")
    .maybeSingle();
  if (completionError || !completed) return { error: "Contagem salva, mas o evento não pôde ser concluído." };

  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  return { success: "Contagem salva com segurança." };
}
