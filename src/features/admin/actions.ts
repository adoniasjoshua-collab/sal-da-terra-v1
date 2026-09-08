"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { removesActiveAdmin } from "@/services/membership";

const membershipSchema = z.object({
  id: z.uuid(),
  role: z.enum(["student", "leader", "admin"]),
  is_active: z.enum(["true", "false"]),
});

export type MembershipState = { error?: string; success?: string } | undefined;

export async function updateMembership(
  _: MembershipState,
  formData: FormData,
): Promise<MembershipState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: "Apenas administradores podem alterar acessos." };

  const parsed = membershipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise a função e o estado do acesso." };

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("ministry_members")
    .select("id,profile_id,role,is_active")
    .eq("id", parsed.data.id)
    .eq("ministry_id", actor.ministryId)
    .maybeSingle();

  if (currentError || !current) return { error: "Este vínculo não pertence ao ministério autorizado." };

  const nextActive = parsed.data.is_active === "true";
  if (current.role === parsed.data.role && current.is_active === nextActive) {
    return { success: "Nenhuma alteração foi necessária." };
  }

  if (removesActiveAdmin(current.role, current.is_active, parsed.data.role, nextActive)) {
    if (current.profile_id === actor.userId) {
      return { error: "Por segurança, outro administrador deve alterar o seu acesso." };
    }

    const { count, error: countError } = await supabase
      .from("ministry_members")
      .select("id", { count: "exact", head: true })
      .eq("ministry_id", actor.ministryId)
      .eq("role", "admin")
      .eq("is_active", true);

    if (countError) return { error: "Não foi possível validar os administradores ativos." };
    if ((count ?? 0) <= 1) return { error: "O ministério precisa manter pelo menos um administrador ativo." };
  }

  const { data: updated, error } = await supabase
    .from("ministry_members")
    .update({ role: parsed.data.role, is_active: nextActive })
    .eq("id", parsed.data.id)
    .eq("ministry_id", actor.ministryId)
    .select("id")
    .maybeSingle();

  if (error?.message.includes("retain at least one active admin")) {
    return { error: "O ministério precisa manter pelo menos um administrador ativo." };
  }
  if (error || !updated) return { error: "Não foi possível atualizar este acesso." };

  revalidatePath("/administracao");
  return { success: "Acesso atualizado e registrado na auditoria." };
}

const signatorySchema = z.object({
  id: z.string().optional(),
  full_name: z.string().trim().min(2).max(160),
  role_title: z.string().trim().min(2).max(100),
  phone: z.union([z.literal(""), z.string().trim().min(8).max(30)]).optional(),
  email: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success).optional(),
  display_order: z.coerce.number().int().min(0).max(20),
  is_active: z.enum(["on"]).optional(),
});

export async function saveReportSignatory(_: MembershipState, formData: FormData): Promise<MembershipState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: "Apenas administradores podem configurar assinaturas." };
  const parsed = signatorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise nome, função, telefone e e-mail do líder." };

  const supabase = await createClient();
  const values = {
    full_name: parsed.data.full_name,
    role_title: parsed.data.role_title,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    display_order: parsed.data.display_order,
    is_active: parsed.data.is_active === "on",
  };
  if (parsed.data.id && !z.uuid().safeParse(parsed.data.id).success) return { error: "Assinatura inválida." };
  const id = parsed.data.id || null;
  const query = id
    ? supabase.from("report_signatories").update(values).eq("id", id).eq("ministry_id", actor.ministryId)
    : supabase.from("report_signatories").insert({ ...values, ministry_id: actor.ministryId, created_by: actor.userId });
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) return { error: "Não foi possível salvar o responsável pelos relatórios." };
  revalidatePath("/administracao");
  revalidatePath("/relatorios");
  return { success: "Assinatura de relatório atualizada." };
}
