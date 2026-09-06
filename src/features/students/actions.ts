"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { studentFromForm } from "./schema";

export type ActionState = { error?: string; success?: string } | undefined;

export async function createStudent(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireStaff();
  const parsed = studentFromForm(formData);
  if (!parsed.success) return { error: "Revise os campos obrigatórios." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert({
      ...parsed.data,
      ministry_id: actor.ministryId,
      created_by: actor.userId,
      is_active: parsed.data.status !== "inactive",
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível cadastrar. Tente novamente." };
  revalidatePath("/adolescentes");
  redirect(`/adolescentes/${data.id}`);
}

export async function updateStudent(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireStaff();
  const parsedId = z.uuid().safeParse(id);
  const parsed = studentFromForm(formData);
  if (!parsedId.success || !parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ ...parsed.data, is_active: parsed.data.status !== "inactive" })
    .eq("id", parsedId.data)
    .eq("ministry_id", actor.ministryId)
    .neq("status", "archived")
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Não foi possível salvar este cadastro." };
  revalidatePath(`/adolescentes/${parsedId.data}`);
  revalidatePath("/adolescentes");
  return { success: "Cadastro atualizado." };
}

export async function archiveStudent(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireStaff();
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!parsed.success) return { error: "Cadastro inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ status: "archived", is_active: false, archived_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("ministry_id", actor.ministryId)
    .neq("status", "archived")
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Não foi possível arquivar este cadastro." };
  revalidatePath("/adolescentes");
  redirect("/adolescentes");
}

export async function reactivateStudent(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireStaff();
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!parsed.success) return { error: "Cadastro inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ status: "active", is_active: true, archived_at: null })
    .eq("id", parsed.data)
    .eq("ministry_id", actor.ministryId)
    .eq("status", "archived")
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Não foi possível reativar este cadastro." };
  revalidatePath(`/adolescentes/${parsed.data}`);
  revalidatePath("/adolescentes");
  return { success: "Cadastro reativado." };
}
