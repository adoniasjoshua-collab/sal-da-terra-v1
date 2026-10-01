import "server-only";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  const status = !found.email_confirmed_at ? "pending" as const : "active" as const;
  return { status, email: found?.email ?? null, configured };
}
