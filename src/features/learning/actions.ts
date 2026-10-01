"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { learningCommandSchema, learningError, type LearningResult } from "@/services/learning";

export async function runLearningCommand(input: unknown): Promise<{ error?: string; result?: LearningResult }> {
  const actor = await requireAuth();
  const parsed = learningCommandSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os campos obrigatórios antes de continuar." };
  const { command, ...fields } = parsed.data;
  const target = "target" in fields ? fields.target : null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("learning_command", {
    target_ministry: actor.ministryId, command, target_id: target, payload: fields,
  });
  if (error) return { error: learningError(error.message) };
  for (const route of ["/conhecimento", "/trilhas", "/trilhas/fundamentos", "/trilhas/fundamentos/voce-faz-parte", "/meu-progresso", "/conhecimento/gestao"]) revalidatePath(route);
  if (command === "enroll" && target) {
    revalidatePath(`/adolescentes/${target}`);
    revalidatePath(`/adolescentes/${target}/editar`);
  }
  return { result: data as LearningResult };
}
