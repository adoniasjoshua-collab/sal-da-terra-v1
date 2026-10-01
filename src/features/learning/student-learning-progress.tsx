import Link from "next/link";
import { getLearningSnapshot } from "./data";
import { learningNextStep, learningProgress, learningStage, stageLabels } from "@/services/learning";

// Read-only Mundo 1 progress on the adolescent profile, for any staff member.
export async function StudentLearningProgress({ studentId, ministryId }: { studentId: string; ministryId: string }) {
  const { data } = await getLearningSnapshot(ministryId);
  const enrollment = data?.students.find((item) => item.id === studentId)?.enrollment;
  if (!data?.content || !enrollment?.is_active) return null;
  const progress = learningProgress(enrollment, data.content);
  return <section className="card mt-7 p-5 sm:p-6" aria-labelledby="learning-progress-title">
    <p className="text-sm font-bold text-[#176b49]">MINHA JORNADA · MUNDO 1</p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 id="learning-progress-title" className="text-xl font-black">{stageLabels[learningStage(enrollment, data.content)]}</h2><p className="font-bold">{progress.percent}% · {enrollment.xp} XP</p></div>
    <div className="mt-3 h-2.5 rounded-full bg-[#e7ece8]"><div className="h-2.5 rounded-full bg-[#176b49]" style={{ width: `${progress.percent}%` }} /></div>
    <p className="mt-3 text-sm">Próximo passo: <strong>{learningNextStep(enrollment, data.content)}</strong></p>
    <p className="mt-1 text-xs text-[#647268]">Atividades educacionais; não medem fé nem espiritualidade.</p>
    <Link className="button-secondary mt-4" href="/conhecimento/gestao#follow-up-title">Acompanhar e validar práticas</Link>
  </section>;
}
