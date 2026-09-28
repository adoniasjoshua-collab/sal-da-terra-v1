import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

// Auth Admin API only (create identities, issue links). Never query application
// tables with this client: authorization belongs to the caller's session + RLS.
export function createAdminAuthClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.length < 20) return null;
  return createClient(getSupabaseEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
}
