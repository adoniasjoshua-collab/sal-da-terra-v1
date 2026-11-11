import "server-only";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { usernameFromEmail } from "@/services/student-quick-access";

export type QuickAccessInfo = { username: string; codeState: "active" | "expired" | "none"; expiresAt: string | null };

// Call only after confirming the actor is an administrator of the student's ministry.
export async function getStudentAccess(authUserId: string | null, ministryId: string, studentActive: boolean) {
  const auth = createAdminAuthClient();
  const configured = Boolean(auth);
  if (!studentActive) return { status: "inactive" as const, email: null, configured };
  if (!authUserId) return { status: "none" as const, email: null, configured };
  const supabase = await createClient();
  const { data: membership, error } = await supabase.from("ministry_members").select("is_active").eq("profile_id", authUserId).eq("ministry_id", ministryId).eq("role", "student").maybeSingle();
  if (error) return { status: "unavailable" as const, email: null, configured };
  if (!membership?.is_active) return { status: "inactive" as const, email: null, configured };
  const account = auth ? await auth.getUserById(authUserId) : null;
  const found = account?.data?.user;
  if (account?.error || !found) return { status: "unavailable" as const, email: null, configured };
  const username = usernameFromEmail(found.email);
  if (username) return { status: "active" as const, email: null, configured, quick: await quickAccess(username, authUserId) };
  const status = !found.email_confirmed_at ? "pending" as const : "active" as const;
  return { status, email: found?.email ?? null, configured };
}

async function quickAccess(username: string, authUserId: string): Promise<QuickAccessInfo> {
  const supabase = await createClient();
  // Invalidate codes that just expired so the status shown is the real one.
  await supabase.rpc("expire_student_access_codes");
  const { data } = await supabase.from("student_quick_access").select("code_expires_at,code_revoked_at").eq("profile_id", authUserId).maybeSingle();
  const expiresAt = data?.code_expires_at ?? null;
  const codeState = !expiresAt ? "none" : data?.code_revoked_at || new Date(expiresAt) <= new Date() ? "expired" : "active";
  return { username, codeState, expiresAt };
}
