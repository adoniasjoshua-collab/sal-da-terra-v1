import "server-only";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Call only after confirming the actor is an administrator of the student's ministry.
export async function getStudentAccess(authUserId: string | null) {
  const auth = createAdminAuthClient();
  const configured = Boolean(auth);
  if (!authUserId) return { status: "none" as const, email: null, configured };
  const supabase = await createClient();
  const { data: membership } = await supabase.from("ministry_members").select("is_active").eq("profile_id", authUserId).maybeSingle();
  const found = auth ? (await auth.getUserById(authUserId)).data?.user : null;
  const status = !membership?.is_active ? "inactive" as const : found && !found.email_confirmed_at ? "pending" as const : "active" as const;
  return { status, email: found?.email ?? null, configured };
}
