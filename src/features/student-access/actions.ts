"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { portalOrigin } from "@/lib/portal-origin";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { accessError, accessLink, createAccessSchema, inviteMessage, reissueAccessSchema, whatsappNumber } from "@/services/student-access";
import { codeMessage, generateAccessCode, quickAccessEmail, quickAccessError, quickAccessSchema, reissueCodeSchema, usernameCandidate } from "@/services/student-quick-access";

export type AccessState = {
  error?: string; link?: string; message?: string; whatsapp?: string | null;
  // Quick access: shown once to the administrator, never stored in plain text.
  username?: string; code?: string; expiresAt?: string;
} | undefined;

const missingKey = "Configuração pendente: defina SUPABASE_SERVICE_ROLE_KEY nas variáveis do servidor para gerar convites.";

type StudentContact = { preferred_name: string | null; full_name: string; guardian_phone: string | null };
async function linkResult(student: StudentContact, tokenHash: string, type: "invite" | "recovery"): Promise<AccessState> {
  const link = accessLink(await portalOrigin(), tokenHash, type);
  return { link, message: inviteMessage(studentName(student), link), whatsapp: whatsappNumber(student.guardian_phone) };
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

function studentName(student: StudentContact) {
  return student.preferred_name || student.full_name.split(" ")[0];
}

async function codeResult(student: StudentContact, username: string, code: string, expiresAt: string): Promise<AccessState> {
  return { username, code, expiresAt, message: codeMessage(studentName(student), await portalOrigin(), username, code, expiresAt), whatsapp: whatsappNumber(student.guardian_phone) };
}

function refreshAccessScreens(studentId: string) {
  revalidatePath(`/adolescentes/${studentId}`);
  revalidatePath(`/adolescentes/${studentId}/editar`);
  revalidatePath("/administracao");
  revalidatePath("/conhecimento/gestao");
}

const MAX_USERNAME_ATTEMPTS = 20;

// Creates an account without e-mail: username + temporary 7-day code (ADR-012).
export async function createQuickAccess(_: AccessState, formData: FormData): Promise<AccessState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: quickAccessError("student_access_denied") };
  const parsed = quickAccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados." };
  const auth = createAdminAuthClient();
  if (!auth) return { error: missingKey };

  const supabase = await createClient();
  const { data: student, error: studentError } = await supabase.from("students")
    .select("id,full_name,preferred_name,guardian_phone,auth_user_id,is_active,status")
    .eq("id", parsed.data.student_id).eq("ministry_id", actor.ministryId).maybeSingle();
  if (studentError) return { error: "Não foi possível consultar o cadastro. Atualize a página e tente novamente." };
  if (!student) return { error: "Cadastro não encontrado neste ministério." };
  if (!student.is_active || student.status === "archived") return { error: quickAccessError("student_access_inactive") };
  if (student.auth_user_id) {
    refreshAccessScreens(student.id);
    return { error: quickAccessError("student_access_exists") };
  }

  // The internal address is unique in Auth, so a taken username fails here and
  // the next candidate (joao.silva2, joao.silva3 …) is tried. Never repurposed.
  let username = "";
  let userId = "";
  for (let attempt = 1; attempt <= MAX_USERNAME_ATTEMPTS && !userId; attempt++) {
    const candidate = usernameCandidate(parsed.data.username, attempt);
    const created = await auth.createUser({ email: quickAccessEmail(candidate), email_confirm: true });
    if (created.data?.user) { username = candidate; userId = created.data.user.id; break; }
    const taken = created.error?.status === 422 || /already|exists|registered/i.test(created.error?.message ?? "");
    if (!taken) return { error: "Não foi possível criar a conta de acesso." };
  }
  if (!userId) return { error: quickAccessError("student_username_taken") };

  const code = generateAccessCode();
  const { data: expiresAt, error } = await supabase.rpc("provision_student_quick_access", {
    target_student: student.id, target_profile: userId, target_username: username, code,
  });
  if (error || !expiresAt) {
    await auth.deleteUser(userId);
    if (error?.message.includes("student_access_exists")) refreshAccessScreens(student.id);
    return { error: quickAccessError(error?.message ?? "") };
  }
  refreshAccessScreens(student.id);
  return codeResult(student, username, code, expiresAt as string);
}

// New 7-day code for a quick-access student (forgotten password or expired code).
export async function reissueAccessCode(_: AccessState, formData: FormData): Promise<AccessState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: quickAccessError("student_access_denied") };
  const parsed = reissueCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Cadastro inválido." };

  const supabase = await createClient();
  const { data: student } = await supabase.from("students")
    .select("id,full_name,preferred_name,guardian_phone")
    .eq("id", parsed.data.student_id).eq("ministry_id", actor.ministryId).maybeSingle();
  if (!student) return { error: "Cadastro não encontrado neste ministério." };
  const { data: access } = await supabase.from("student_quick_access").select("username").eq("student_id", student.id).maybeSingle();
  if (!access) return { error: quickAccessError("student_access_missing") };

  const code = generateAccessCode();
  // The RPC re-checks admin scope and active access, writes the code and audits it.
  const { data: expiresAt, error } = await supabase.rpc("issue_student_access_code", { target_student: student.id, code });
  if (error || !expiresAt) return { error: quickAccessError(error?.message ?? "") };
  refreshAccessScreens(student.id);
  return codeResult(student, access.username, code, expiresAt as string);
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
