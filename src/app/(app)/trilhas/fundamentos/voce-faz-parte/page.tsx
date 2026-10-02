import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireAuth } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { LearningUnavailable } from "@/features/learning/catalog";
import { WorldEditorialPreview, WorldPlayer } from "@/features/learning/world-player";
import { WorldCover } from "@/features/learning/world-cover";
import { canReviewContent } from "@/services/learning";

export default async function WorldPage() {
  const actor = await requireAuth();
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  const content = data?.content;
  if (error) return <LearningUnavailable />;
  if (!content) return <section className="card p-6"><h1 className="text-2xl font-black">Este mundo ainda não está disponível para você</h1><p className="mt-3">A leitura depende de conteúdo publicado e inscrição autorizada. Converse com a liderança.</p><Link className="button-secondary mt-4" href="/trilhas/fundamentos">Voltar ao mapa</Link></section>;
  if (actor.role !== "student" && !canReviewContent(actor, data.publication)) return <section className="card p-6"><h1 className="text-2xl font-black">Prévia restrita à revisão</h1><p className="mt-3">A prévia editorial e a simulação do aluno ficam disponíveis para o administrador e para quem foi designado autor ou revisor desta versão.</p><Link className="button-secondary mt-4" href="/conhecimento/gestao">Voltar à gestão</Link></section>;
  return <><PageHeading eyebrow="Mundo 1 · Fundamentos Sal da Terra" title={content.title} description={content.centralIdea} />
    <WorldCover />
    {actor.role === "student" && data.enrollment ? <WorldPlayer content={content} enrollment={data.enrollment} userId={actor.userId} readOnly={data.publication?.state !== "published"} /> : <div className="grid gap-5">
      <div className="rounded-xl bg-amber-50 p-4"><p className="font-bold">Prévia editorial · versão {content.version}</p><p className="mt-2 text-sm">Confira texto/contexto, adequação etária, gabaritos, segurança da prática e regras antes da aprovação. Esta prévia não registra progresso.</p><div className="mt-3 flex flex-wrap gap-3"><Link className="button-primary" href="/trilhas/fundamentos/voce-faz-parte/simulacao">Ver como aluno (simulação)</Link><Link className="button-secondary" href="/conhecimento/gestao">Voltar à revisão e publicação</Link></div></div>
      <WorldEditorialPreview content={content} />
      <section className="card p-6"><h2 className="text-xl font-bold">Gabaritos e revisão doutrinária</h2>{[...content.cards.map((card) => card.checkpoint), content.exercise, ...content.questions].map((q) => <article className="mt-5" key={q.id}><h3 className="font-bold">{q.prompt}</h3><ol className="mt-2 list-decimal space-y-2 pl-5">{q.options.map((option, index) => <li key={option}>{option}{q.correct === index && <strong> — resposta esperada</strong>}</li>)}</ol><p className="mt-2 text-sm">{q.explanation}</p></article>)}</section>
      <section className="card p-6"><h2 className="text-xl font-bold">Prática e fechamento</h2><p className="mt-3 leading-7">{content.practice}</p><p className="mt-3 leading-7">{content.closing}</p><p className="mt-3 leading-7 italic">Oração opcional: {content.prayer}</p><p className="mt-3">Conquista: {content.achievement}</p><p className="mt-3 text-sm">Critério do quiz: {content.rules.passingPercent}%. XP por conjunto de leituras: {content.rules.xp.reading}; exercício: {content.rules.xp.exercise}; quiz aprovado: {content.rules.xp.quiz}; resumo: {content.rules.xp.summary}; prática validada: {content.rules.xp.practice}. Créditos únicos; sem exigência de presença histórica.</p></section>
    </div>}
  </>;
}
