"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { portalOrigin } from "@/lib/portal-origin";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { accessLink } from "@/services/student-access";
import { createStaffSchema, reissueStaffSchema, staffAccessError, staffInviteMessage } from "@/services/staff-access";
import type { AccessState } from "@/features/student-access/actions";

const missingKey = "Configuração pendente: defina SUPABASE_SERVICE_ROLE_KEY nas variáveis do servidor para gerar convites.";

async function linkResult(name: string, tokenHash: string, type: "invite" | "recovery"): Promise<AccessState> {
  const link = accessLink(await portalOrigin(), tokenHash, type);
  return { link, message: staffInviteMessage(name.split(" ")[0], link), whatsapp: null };
}

export async function createStaffAccess(_: AccessState, formData: FormData): Promise<AccessState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: staffAccessError("staff_access_denied") };
  const parsed = createStaffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados." };
  const auth = createAdminAuthClient();
  if (!auth) return { error: missingKey };

  // createUser fails for an existing e-mail, so the identity below is always new
  // and safe to delete if linking fails. Existing accounts are never repurposed.
  const created = await auth.createUser({ email: parsed.data.email, email_confirm: false });
  if (created.error || !created.data.user) {
    return { error: created.error?.status === 422 || /already|exists|registered/i.test(created.error?.message ?? "") ? staffAccessError("staff_access_identity") : "Não foi possível criar a conta de acesso." };
  }
  const userId = created.data.user.id;
  const { data: generated, error: linkError } = await auth.generateLink({ type: "invite", email: parsed.data.email });
  if (linkError || !generated?.properties?.hashed_token || generated.user?.id !== userId) {
    await auth.deleteUser(userId);
    return { error: "Não foi possível gerar o convite. Tente novamente em alguns minutos." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("provision_staff_access", { target_ministry: actor.ministryId, target_profile: userId, display_name: parsed.data.full_name });
  if (error) {
    await auth.deleteUser(userId);
    return { error: staffAccessError(error.message) };
  }
  revalidatePath("/administracao");
  revalidatePath("/conhecimento/gestao");
  return linkResult(parsed.data.full_name, generated.properties.hashed_token, "invite");
}

export async function reissueStaffAccess(_: AccessState, formData: FormData): Promise<AccessState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: staffAccessError("staff_access_denied") };
  const parsed = reissueStaffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Vínculo inválido." };
  const auth = createAdminAuthClient();
  if (!auth) return { error: missingKey };

  const supabase = await createClient();
  // The RPC re-checks admin scope, restricts links to active leaders and audits the reissue.
  const { data: profileId, error } = await supabase.rpc("issue_staff_access_link", { target_member: parsed.data.member_id });
  if (error || !profileId) return { error: staffAccessError(error?.message ?? "") };
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", profileId as string).maybeSingle();
  const { data: found } = await auth.getUserById(profileId as string);
  const account = found?.user;
  if (!account?.email) return { error: "A conta vinculada não foi encontrada. Contate o suporte técnico." };
  // Accepted invitations need a recovery link; pending ones get a fresh invitation.
  const type = account.email_confirmed_at ? "recovery" : "invite";
  const { data: generated, error: linkError } = await auth.generateLink({ type, email: account.email });
  if (linkError || !generated?.properties?.hashed_token) return { error: "Não foi possível gerar o link. Tente novamente em alguns minutos." };
  return linkResult(profile?.full_name ?? "Líder", generated.properties.hashed_token, type);
}
