import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LearningSnapshot } from "@/services/learning";

export async function getLearningSnapshot(ministryId: string): Promise<{ data: LearningSnapshot | null; error: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("learning_snapshot", { target_ministry: ministryId });
  return { data: error ? null : data as LearningSnapshot, error: Boolean(error) };
}
