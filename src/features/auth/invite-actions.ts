"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";

const inviteSchema = z.object({
  token_hash: z.string().min(10).max(200).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["invite", "recovery"]),
});

export async function acceptInvite(formData: FormData) {
  const parsed = inviteSchema.safeParse({ token_hash: formData.get("token_hash"), type: formData.get("type") });
  if (parsed.success) {
    const role = await getCurrentRole();
    if (role === "admin" || role === "leader") redirect("/convite?erro=sessao-equipe");
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp(parsed.data);
    if (!error) redirect("/definir-senha");
    // A repeated submission (double tap) fails after the first one already
    // signed the student in; continue to password setup instead of an error.
    if (await getCurrentRole() === "student") redirect("/definir-senha");
    // Diagnostic only: never log the token itself.
    console.warn("invite verification failed", { type: parsed.data.type, code: error.code, status: error.status });
  }
  redirect("/login?erro=convite-invalido");
}
