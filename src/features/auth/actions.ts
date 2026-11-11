"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/services/password-policy";
import { loginEmail } from "@/services/student-quick-access";

export type LoginState = { error?: string } | undefined;
const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Informe seu e-mail ou usuário.").max(254, "Informe um e-mail ou usuário válido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(128, "A senha é muito longa."),
});
// Same message for every failure: never reveal whether a username exists.
const invalidLogin = "Usuário, e-mail ou senha inválidos. Se você recebeu um código de acesso, ele vale 7 dias; se expirou, peça um novo à liderança.";

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ identifier: formData.get("identifier"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const email = loginEmail(parsed.data.identifier);
  if (!email) return { error: "Informe um e-mail ou usuário válido." };
  const supabase = await createClient();
  // Expired temporary codes are invalidated before any credential is checked.
  await supabase.rpc("expire_student_access_codes");
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) return { error: invalidLogin };
  const { data: codeState } = await supabase.rpc("my_access_code_state");
  if (codeState === "expired") {
    await supabase.auth.signOut();
    return { error: invalidLogin };
  }
  if (codeState === "active") redirect("/definir-senha");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type PasswordState = { error?: string } | undefined;

export async function updatePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const actor = await requireAuth({ allowTemporaryCode: true });
  const parsed = passwordSchema(actor.role).safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise a senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error?.code === "same_password") return { error: "Crie uma senha diferente do código recebido." };
  if (error) return { error: "Não foi possível definir a senha. Solicite um novo convite." };
  if (actor.role === "student") {
    // Ends the temporary-code phase; the database confirms the code was replaced.
    const { error: completeError } = await supabase.rpc("complete_student_access_code", { new_password: parsed.data.password });
    if (completeError) return { error: "Crie uma senha diferente do código recebido." };
  }
  redirect(actor.role === "student" ? "/minha-participacao" : "/dashboard");
}
