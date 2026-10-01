import Link from "next/link";
import { getLearningSnapshot } from "./data";

// Staff dashboard cue: learners waiting for an adult to validate their practice.
export async function LearningAlert({ ministryId }: { ministryId: string }) {
  const { data } = await getLearningSnapshot(ministryId);
  if (!data || data.publication?.state !== "published") return null;
  const pending = data.students.filter((student) => student.enrollment?.is_active && student.enrollment.practice_state === "pending").length;
  if (pending === 0) return null;
  return <Link href="/conhecimento/gestao?filtro=atencao#follow-up-title" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
    <span><strong>Minha Jornada:</strong> {pending} prática(s) aguardando validação da liderança.</span>
    <span className="font-bold underline">Validar agora</span>
  </Link>;
}
