"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;
const loginSchema = z.object({ email: z.email("Informe um e-mail válido").trim(), password: z.string().min(8, "A senha deve ter ao menos 8 caracteres") });

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "E-mail ou senha inválidos." };
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type PasswordState = { error?: string } | undefined;
const passwordSchema = z.object({
  password: z.string()
    .min(12, "Use pelo menos 12 caracteres.")
    .max(128, "A senha é muito longa.")
    .regex(/[a-z]/, "Inclua uma letra minúscula.")
    .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
    .regex(/[0-9]/, "Inclua um número."),
  confirmation: z.string(),
}).refine((values) => values.password === values.confirmation, {
  message: "As senhas não são iguais.",
  path: ["confirmation"],
});

export async function updatePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const actor = await requireAuth();
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise a senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Não foi possível definir a senha. Solicite um novo convite." };
  redirect(actor.role === "student" ? "/minha-participacao" : "/dashboard");
}
