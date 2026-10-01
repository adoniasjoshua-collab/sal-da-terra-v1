import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireStaff } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { LearningUnavailable } from "@/features/learning/catalog";
import { StudentSimulation } from "@/features/learning/student-simulation";
import { WorldCover } from "@/features/learning/world-cover";

export const metadata: Metadata = { title: "Simulação do aluno" };

// Leadership-only: works before publication so reviewers can rehearse the learner view.
export default async function StudentSimulationPage() {
  const actor = await requireStaff();
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  if (error || !data?.content) return <LearningUnavailable />;
  const content = data.content;
  return <>
    <PageHeading eyebrow="Mundo 1 · Visão do aluno" title={content.title} description={content.centralIdea}
      action={<Link className="button-secondary" href="/trilhas/fundamentos/voce-faz-parte">Voltar à prévia editorial</Link>} />
    <WorldCover />
    <StudentSimulation content={content} userId={actor.userId} />
  </>;
}
