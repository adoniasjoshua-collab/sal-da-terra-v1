import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireStaff } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { LearningUnavailable } from "@/features/learning/catalog";
import { StudentSimulation } from "@/features/learning/student-simulation";
import { WorldCover } from "@/features/learning/world-cover";
import { canReviewContent } from "@/services/learning";

export const metadata: Metadata = { title: "Simulação do aluno" };

// Admin/assigned editors only: works before publication so the reviewer can rehearse the learner view.
export default async function StudentSimulationPage() {
  const actor = await requireStaff();
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  if (error || !data?.content) return <LearningUnavailable />;
  if (!canReviewContent(actor, data.publication)) return <section className="card p-6"><h1 className="text-2xl font-black">Prévia restrita à revisão</h1><p className="mt-3">A prévia editorial e a simulação do aluno ficam disponíveis para o administrador e para quem foi designado autor ou revisor desta versão.</p><Link className="button-secondary mt-4" href="/conhecimento/gestao">Voltar à gestão</Link></section>;
  const content = data.content;
  return <>
    <PageHeading eyebrow="Mundo 1 · Visão do aluno" title={content.title} description={content.centralIdea}
      action={<Link className="button-secondary" href="/trilhas/fundamentos/voce-faz-parte">Voltar à prévia editorial</Link>} />
    <WorldCover />
    <StudentSimulation content={content} userId={actor.userId} />
  </>;
}
