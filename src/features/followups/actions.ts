"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FollowupState = { error?: string; success?: boolean } | undefined;
const schema = z.object({ student_id: z.uuid(), followup_type: z.enum(["conversation","phone_call","whatsapp","family_contact","visit","prayer","other"]), occurred_at: z.string().min(10), summary: z.string().trim().min(2).max(2000), next_action: z.string().trim().max(500).optional(), next_action_date: z.string().optional(), is_sensitive: z.string().optional() });

export async function createFollowup(_: FollowupState, formData: FormData): Promise<FollowupState> {
  const actor = await requireStaff();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados do acompanhamento." };
  const supabase = await createClient();
  const { error } = await supabase.from("pastoral_followups").insert({ ministry_id: actor.ministryId, student_id: parsed.data.student_id, leader_id: actor.userId, followup_type: parsed.data.followup_type, occurred_at: new Date(parsed.data.occurred_at).toISOString(), summary: parsed.data.summary, next_action: parsed.data.next_action || null, next_action_date: parsed.data.next_action_date || null, is_sensitive: parsed.data.is_sensitive === "on", status: "open" });
  if (error) return { error: "Não foi possível registrar o acompanhamento." };
  revalidatePath(`/adolescentes/${parsed.data.student_id}`); revalidatePath("/dashboard");
  return { success: true };
}
