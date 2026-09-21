"use server";

import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidateMinistry } from "@/lib/revalidate-ministry";
import { followupSchema, followupValues } from "./schema";

export type FollowupState = { error?: string; success?: boolean } | undefined;

export async function createFollowup(_: FollowupState, formData: FormData): Promise<FollowupState> {
  const actor = await requireStaff();
  const parsed = followupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados do acompanhamento." };
  const supabase = await createClient();
  const { error } = await supabase.from("pastoral_followups").insert({ ...followupValues(parsed.data), ministry_id: actor.ministryId, student_id: parsed.data.student_id, leader_id: actor.userId });
  if (error) return { error: "Não foi possível registrar o acompanhamento." };
  revalidateMinistry();
  return { success: true };
}

export async function updateFollowup(id: string, _: FollowupState, formData: FormData): Promise<FollowupState> {
  const actor = await requireStaff();
  const parsedId = z.uuid().safeParse(id);
  const parsed = followupSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success || !parsed.success) return { error: "Revise os dados do acompanhamento." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("pastoral_followups")
    .update(followupValues(parsed.data))
    .eq("id", parsedId.data)
    .eq("student_id", parsed.data.student_id)
    .eq("ministry_id", actor.ministryId)
    .select("id").maybeSingle();
  if (error || !data) return { error: "Não foi possível atualizar este acompanhamento." };
  revalidateMinistry();
  return { success: true };
}
