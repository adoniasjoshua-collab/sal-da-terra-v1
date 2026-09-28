import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { requireAuth } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { LearningUnavailable } from "@/features/learning/catalog";
import { practiceLabels } from "@/services/learning";

export default async function ProgressPage() {
  const actor = await requireAuth();
  if (actor.role !== "student") redirect("/conhecimento/gestao");
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  const enrollment = data?.enrollment;
  return <><PageHeading eyebrow="Minha Jornada" title="Meu progresso" description="Suas atividades educacionais, de forma privada e no seu ritmo." />
    {error ? <LearningUnavailable /> : enrollment ? <section className="card p-6"><h2 className="text-xl font-black">Você faz parte!</h2><p className="mt-3">{enrollment.xp} XP · {enrollment.readings.length} leituras confirmadas</p><p className="mt-2">Quiz: {enrollment.quiz_passed ? "concluído" : "a realizar"}</p><p className="mt-2">{practiceLabels[enrollment.practice_state]}</p>{enrollment.completed_at && <p className="mt-4 rounded-xl bg-[#edf7f1] p-4 font-bold">Conquista: Comecei Minha Jornada</p>}<Link className="button-primary mt-5" href="/trilhas/fundamentos/voce-faz-parte">Retomar meu mundo</Link></section> : <p className="card p-6">Você ainda não tem uma inscrição ativa. Converse com a liderança para começar.</p>}
    <Link className="button-secondary mt-5" href="/trilhas/fundamentos">Ver mapa da trilha</Link>
  </>;
}
