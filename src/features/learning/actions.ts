"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { learningCommandSchema, learningError, type LearningResult, type LearningSnapshot } from "@/services/learning";

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

export type BulkEnrollState = { error?: string; success?: string } | undefined;

// Enrolls every eligible learner (linked account, no active enrollment, not a
// test record) through the same audited learning_command, one call per learner.
export async function enrollAllEligible(_: BulkEnrollState, formData: FormData): Promise<BulkEnrollState> {
  const actor = await requireAuth();
  if (actor.role !== "admin") return { error: "Apenas administradores autorizam inscrições." };
  if (formData.get("confirmed") !== "on") return { error: "Confirme a ciência dos responsáveis antes de inscrever." };
  const supabase = await createClient();
  const [{ data: snapshot, error }, { data: tests, error: testsError }] = await Promise.all([
    supabase.rpc("learning_snapshot", { target_ministry: actor.ministryId }),
    supabase.from("students").select("id").eq("ministry_id", actor.ministryId).eq("is_test", true),
  ]);
  if (error || testsError || !snapshot) return { error: "Não foi possível carregar os alunos. Atualize a página." };
  const testIds = new Set((tests ?? []).map((row) => row.id));
  const eligible = (snapshot as LearningSnapshot).students.filter((student) => student.hasAccount && !student.enrollment?.is_active && !testIds.has(student.id));
  if (eligible.length === 0) return { success: "Nenhum aluno com conta aguardando inscrição." };
  let enrolled = 0;
  for (const student of eligible) {
    const { error: enrollError } = await supabase.rpc("learning_command", { target_ministry: actor.ministryId, command: "enroll", target_id: student.id, payload: { confirmed: true } });
    if (!enrollError) enrolled += 1;
  }
  for (const route of ["/conhecimento/gestao", "/trilhas/fundamentos", "/meu-progresso"]) revalidatePath(route);
  const skipped = eligible.length - enrolled;
  return enrolled === 0 ? { error: "Nenhuma inscrição foi concluída. Confira se o módulo está publicado e se os acessos estão ativos." }
    : { success: `${enrolled} aluno(s) inscrito(s).${skipped ? ` ${skipped} não puderam ser inscritos; confira o acesso na ficha.` : ""}` };
}
