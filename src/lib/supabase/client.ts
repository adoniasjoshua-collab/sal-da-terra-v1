"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | undefined;
export function createClient() {
  const env = getSupabaseEnv();
  client ??= createBrowserClient(env.url, env.key);
  return client;
}
