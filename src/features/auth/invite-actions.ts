"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  token_hash: z.string().min(10).max(200).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["invite", "recovery"]),
});

export async function acceptInvite(formData: FormData) {
  const parsed = inviteSchema.safeParse({ token_hash: formData.get("token_hash"), type: formData.get("type") });
  if (parsed.success) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp(parsed.data);
    if (!error) redirect("/definir-senha");
  }
  redirect("/login?erro=convite-invalido");
}
