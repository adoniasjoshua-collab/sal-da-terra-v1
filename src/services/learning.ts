import { z } from "zod";

const uuid = z.uuid();
const answers = z.record(z.string().regex(/^q[1-9][0-9]?$/), z.number().int().min(0).max(9));
export const learningCommandSchema = z.discriminatedUnion("command", [
  z.object({ command: z.literal("configure"), author: uuid, reviewer: uuid }),
  z.object({ command: z.enum(["submit_review", "archive"]) }),
  z.object({ command: z.enum(["approve", "publish"]), confirmed: z.literal(true) }),
  z.object({ command: z.enum(["reject", "recall"]), note: z.string().trim().min(10).max(300) }),
  z.object({ command: z.literal("enroll"), target: uuid, confirmed: z.literal(true) }),
  z.object({ command: z.literal("withdraw"), target: uuid }),
  z.object({ command: z.literal("reading"), target: uuid, reading: z.string().min(1).max(50) }),
  z.object({ command: z.literal("exercise"), target: uuid, answer: z.number().int().min(0).max(9) }),
  z.object({ command: z.literal("save_draft"), target: uuid, answers }),
  z.object({ command: z.literal("quiz"), target: uuid, answers, requestId: uuid }),
  z.object({ command: z.enum(["summary", "request_practice"]), target: uuid }),
  z.object({ command: z.literal("review_practice"), target: uuid, decision: z.enum(["approved", "changes_requested"]), mode: z.enum(["supervised", "equivalent"]), note: z.string().trim().min(10).max(300) }),
]);
export type LearningCommand = z.infer<typeof learningCommandSchema>;
export type Question = { id: string; prompt: string; options: string[]; correct?: number; explanation?: string };
export type WorldContent = {
  slug: string; version: number; ruleVersion: string; title: string; objective: string; centralIdea: string;
  hook: string; audience: string; estimatedMinutes: string; references: string[]; sourceNote: string;
  cards: { id: string; title: string; reference: string; paragraphs: string[] }[];
  exercise: Question; questions: Question[]; practice: string; closing: string; achievement: string;
  rules: { passingPercent: number; xp: Record<string, number> };
  media: { coverAsset: string | null; illustrationAsset: string | null; alt: string; credit: string; license: string; videoUrl: string | null; transcript: string | null; captions: string | null; poster: string | null };
};
export type QuizResult = { passed: boolean; correctCount: number; total: number; feedback: { id: string; correct: boolean; explanation: string }[] };
export type LearningResult = Partial<QuizResult> & { correct?: boolean; explanation?: string };
export type Enrollment = {
  id: string; is_active: boolean; readings: string[]; exercise_done: boolean; quiz_passed: boolean;
  summary_done: boolean; quiz_draft: Record<string, number>; practice_state: "not_requested" | "pending" | "changes_requested" | "approved";
  practice_mode: string | null; review_note?: string | null; completed_at: string | null; xp: number; last_quiz?: QuizResult | null;
  created_at?: string; updated_at?: string;
  reviews?: { decision: string; mode: string; note: string; created_at: string }[];
};
export type Publication = { id?: string; state: "draft" | "in_review" | "approved" | "published" | "archived"; author_id?: string; reviewer_id?: string; review_note?: string | null };
export type LearningSnapshot = {
  publication: Publication | null; content: WorldContent | null; enrollment: Enrollment | null;
  students: { id: string; name: string; hasAccount: boolean; enrollment: Enrollment | null }[];
  editors: { id: string; name: string }[];
};

export function learningProgress(enrollment: Enrollment, content: WorldContent) {
  const total = content.cards.length + 4;
  const done = content.cards.filter((card) => enrollment.readings.includes(card.id)).length
    + Number(enrollment.exercise_done) + Number(enrollment.quiz_passed)
    + Number(enrollment.summary_done) + Number(enrollment.practice_state === "approved");
  return { done, total, percent: Math.floor(done * 100 / total) };
}

export const practiceLabels: Record<Enrollment["practice_state"], string> = {
  not_requested: "Combine a prática com a liderança", pending: "Aguardando validação da liderança",
  changes_requested: "Converse com a liderança para ajustar ou combinar uma alternativa", approved: "Prática validada",
};

export function learningError(message: string) {
  if (message.includes("learning_prerequisite")) return "Conclua as etapas anteriores para continuar.";
  if (message.includes("learning_incomplete_quiz")) return "Responda todas as questões antes de enviar.";
  if (message.includes("learning_rate_limit")) return "Você já enviou várias tentativas. Aguarde um minuto para tentar novamente.";
  if (message.includes("learning_invalid_editors")) return "Escolha dois adultos com acesso ativo: autor e revisor precisam ser pessoas diferentes.";
  if (message.includes("learning_invalid_student")) return "O adolescente precisa de uma conta vinculada e acesso ativo ao ministério.";
  if (message.includes("learning_invalid_transition")) return "A etapa editorial mudou ou esta ação não está disponível para seu papel. Atualize a página.";
  return "Não foi possível salvar. Confira sua conexão e seu acesso e tente novamente. O progresso confirmado permanece salvo.";
}

// Leadership follow-up: one stage per learner, derived from the same flags the
// database writes. Educational activity only; never a measure of faith.
export type LearningStage = "not_enrolled" | "not_started" | "in_progress" | "practice_pending" | "changes_requested" | "completed";
export const stageLabels: Record<LearningStage, string> = {
  not_enrolled: "Sem inscrição", not_started: "Ainda não começou", in_progress: "Em andamento",
  practice_pending: "Prática aguardando validação", changes_requested: "Prática a combinar", completed: "Mundo concluído",
};

export function learningStage(enrollment: Enrollment | null | undefined, content: WorldContent): LearningStage {
  if (!enrollment?.is_active) return "not_enrolled";
  if (enrollment.completed_at) return "completed";
  if (enrollment.practice_state === "pending") return "practice_pending";
  if (enrollment.practice_state === "changes_requested") return "changes_requested";
  return learningProgress(enrollment, content).done === 0 ? "not_started" : "in_progress";
}

export function learningNextStep(enrollment: Enrollment, content: WorldContent) {
  const read = content.cards.filter((card) => enrollment.readings.includes(card.id)).length;
  if (enrollment.completed_at) return "Concluído";
  if (read < content.cards.length) return `Leitura ${read + 1} de ${content.cards.length}`;
  if (!enrollment.exercise_done) return "Escolha de acolhimento";
  if (!enrollment.quiz_passed) return "Quiz";
  if (!enrollment.summary_done) return "Revisão do mundo";
  if (enrollment.practice_state === "pending") return "Validação da prática pela liderança";
  if (enrollment.practice_state === "changes_requested") return "Combinar a prática com a liderança";
  return "Pedir validação da prática";
}
