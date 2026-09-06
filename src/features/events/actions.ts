"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EventState = { error?: string } | undefined;
const eventSchema = z.object({ title: z.string().trim().min(2).max(160), event_date: z.iso.date(), start_time: z.string().optional(), description: z.string().trim().max(1000).optional() });

export async function createEvent(_: EventState, formData: FormData): Promise<EventState> {
  const actor = await requireStaff();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados do evento." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").insert({ ...parsed.data, start_time: parsed.data.start_time || null, description: parsed.data.description || null, type: "EBD", status: "planned", ministry_id: actor.ministryId, created_by: actor.userId }).select("id").single();
  if (error) return { error: "Não foi possível criar a EBD." };
  revalidatePath("/eventos"); redirect(`/eventos/${data.id}`);
}

const attendanceSchema = z.object({ studentId: z.uuid(), status: z.enum(["present", "absent", "justified", "visitor"]) });
export async function saveAttendance(eventId: string, formData: FormData) {
  const actor = await requireStaff();
  if (!z.uuid().safeParse(eventId).success) return;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id,ministry_id").eq("id", eventId).single();
  if (!event || event.ministry_id !== actor.ministryId) return;
  const rows = [...formData.entries()].filter(([key]) => key.startsWith("attendance:")).map(([key, value]) => attendanceSchema.safeParse({ studentId: key.slice(11), status: value })).filter((item) => item.success).map((item) => ({ ministry_id: actor.ministryId, event_id: eventId, student_id: item.data.studentId, attendance_status: item.data.status, registered_by: actor.userId }));
  if (rows.length) await supabase.from("attendance").upsert(rows, { onConflict: "event_id,student_id" });
  await supabase.from("events").update({ status: "completed" }).eq("id", eventId);
  revalidatePath(`/eventos/${eventId}`); revalidatePath("/dashboard");
  redirect(`/eventos/${eventId}?salvo=1`);
}
