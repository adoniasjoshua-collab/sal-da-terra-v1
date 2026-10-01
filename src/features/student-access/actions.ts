"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { accessError, accessLink, createAccessSchema, inviteMessage, reissueAccessSchema, whatsappNumber } from "@/services/student-access";

export type AccessState = { error?: string; link?: string; message?: string; whatsapp?: string | null } | undefined;

const missingKey = "Configuração pendente: defina SUPABASE_SERVICE_ROLE_KEY nas variáveis do servidor para gerar convites.";

// Server Actions only run when Origin matches Host, so the origin is the portal itself.
async function portalOrigin() {
  const h = await headers();
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

type StudentContact = { preferred_name: string | null; full_name: string; guardian_phone: string | null };
async function linkResult(student: StudentContact, tokenHash: string, type: "invite" | "recovery"): Promise<AccessState> {
  const link = accessLink(await portalOrigin(), tokenHash, type);
  const name = student.preferred_name || student.full_name.split(" ")[0];
  return { link, message: inviteMessage(name, link), whatsapp: whatsappNumber(student.guardian_phone) };
}

export async function createStudentAccess(_: AccessState, formData: FormData): Promise<AccessState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: accessError("student_access_denied") };
  const parsed = createAccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados." };
  const auth = createAdminAuthClient();
  if (!auth) return { error: missingKey };

  const supabase = await createClient();
  const { data: student, error: studentError } = await supabase.from("students")
    .select("id,full_name,preferred_name,guardian_phone,auth_user_id,is_active,status")
    .eq("id", parsed.data.student_id).eq("ministry_id", actor.ministryId).maybeSingle();
  if (studentError) return { error: "Não foi possível consultar o cadastro. Atualize a página e tente novamente." };
  if (!student) return { error: "Cadastro não encontrado neste ministério." };
  if (!student.is_active || student.status === "archived") return { error: accessError("student_access_inactive") };
  if (student.auth_user_id) {
    revalidatePath(`/adolescentes/${student.id}`);
    revalidatePath(`/adolescentes/${student.id}/editar`);
    return { error: accessError("student_access_exists") };
  }

  // createUser fails for an existing e-mail, so the identity below is always new
  // and safe to delete if linking fails. Existing accounts are never repurposed.
  const created = await auth.createUser({ email: parsed.data.email, email_confirm: false });
  if (created.error || !created.data.user) {
    return { error: created.error?.status === 422 || /already|exists|registered/i.test(created.error?.message ?? "") ? accessError("student_access_identity") : "Não foi possível criar a conta de acesso." };
  }
  const userId = created.data.user.id;
  const { data: generated, error: linkError } = await auth.generateLink({ type: "invite", email: parsed.data.email });
  // Validate the token before linking. Never delete an identity after successful
  // provisioning merely because the Auth provider returned an incomplete link.
  if (linkError || !generated?.properties?.hashed_token || generated.user?.id !== userId) {
    await auth.deleteUser(userId);
    return { error: "Não foi possível gerar o convite. Tente novamente em alguns minutos." };
  }
  const { error: provisionError } = await supabase.rpc("provision_student_access", { target_student: student.id, target_profile: userId });
  if (provisionError) {
    await auth.deleteUser(userId);
    if (provisionError?.message.includes("student_access_exists")) {
      revalidatePath(`/adolescentes/${student.id}`);
      revalidatePath(`/adolescentes/${student.id}/editar`);
    }
    return { error: accessError(provisionError?.message ?? "") };
  }
  revalidatePath(`/adolescentes/${student.id}`);
  revalidatePath(`/adolescentes/${student.id}/editar`);
  revalidatePath("/administracao");
  revalidatePath("/conhecimento/gestao");
  return linkResult(student, generated.properties.hashed_token, "invite");
}

export async function reissueStudentAccess(_: AccessState, formData: FormData): Promise<AccessState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: accessError("student_access_denied") };
  const parsed = reissueAccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Cadastro inválido." };
  const auth = createAdminAuthClient();
  if (!auth) return { error: missingKey };

  const supabase = await createClient();
  const { data: student } = await supabase.from("students")
    .select("id,full_name,preferred_name,guardian_phone")
    .eq("id", parsed.data.student_id).eq("ministry_id", actor.ministryId).maybeSingle();
  if (!student) return { error: "Cadastro não encontrado neste ministério." };
  // The RPC re-checks admin scope and active access, and records the reissue in the audit log.
  const { data: profileId, error } = await supabase.rpc("issue_student_access_link", { target_student: student.id });
  if (error || !profileId) return { error: accessError(error?.message ?? "") };

  const { data: found } = await auth.getUserById(profileId as string);
  const account = found?.user;
  const email = account?.email;
  if (!account || !email) return { error: "A conta vinculada não foi encontrada. Contate o suporte técnico." };
  // Accepted invitations need a recovery link; pending ones get a fresh invitation.
  const type = account.email_confirmed_at ? "recovery" : "invite";
  const { data: generated, error: linkError } = await auth.generateLink({ type, email });
  if (linkError || !generated?.properties?.hashed_token) return { error: "Não foi possível gerar o link. Tente novamente em alguns minutos." };
  revalidatePath(`/adolescentes/${student.id}`);
  revalidatePath(`/adolescentes/${student.id}/editar`);
  return linkResult(student, generated.properties.hashed_token, type);
}

export async function createTestStudent() {
  const actor = await requireAuth();
  if (actor.role !== "admin") redirect("/dashboard");
  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("create_test_student", { target_ministry: actor.ministryId });
  if (error || !id) redirect(`/administracao?teste=${error?.message.includes("student_test_limit") ? "limite" : "erro"}#aluno-teste`);
  revalidatePath("/adolescentes");
  revalidatePath("/administracao");
  redirect(`/adolescentes/${id}#acesso`);
}
