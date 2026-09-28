import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireAuth } from "@/lib/auth";
import { getLearningSnapshot } from "./data";

export function LearningUnavailable() {
  return <p role="alert" className="card p-5 text-red-800">Não foi possível carregar a jornada. Tente novamente mais tarde. O progresso já salvo permanece preservado.</p>;
}

export async function LearningCatalog() {
  const actor = await requireAuth();
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  return <><PageHeading eyebrow="Minha Jornada" title="Hub de Conhecimento" description="Bíblia, compreensão e cuidado em pequenas etapas." />
    {actor.role !== "student" && <Link className="button-secondary mb-5" href="/conhecimento/gestao">Gerenciar conteúdo e acompanhar alunos</Link>}
    {error ? <LearningUnavailable /> : <section className="card overflow-hidden"><div className="bg-[#143d2c] p-7 text-white"><p className="text-sm font-bold text-[#e6c861]">TEMPORADA 01</p><h2 className="mt-3 text-3xl font-black">Fundamentos Sal da Terra</h2><p className="mt-3 max-w-2xl leading-7">Uma revisão acolhedora para quem está chegando e para quem já caminha com o grupo. Sua jornada digital não depende de presenças passadas.</p></div><div className="p-6"><p className="leading-7">Sete mundos planejados e um desafio final. O primeiro mundo está {data?.publication?.state === "published" ? "publicado para participantes autorizados" : "em preparação e revisão"}; os demais serão liberados após implementação e revisão.</p><Link className="button-primary mt-5" href="/trilhas/fundamentos">Explorar a trilha</Link><p className="mt-4 text-sm text-[#526158]">O progresso representa atividades educacionais. Não mede fé ou espiritualidade.</p></div></section>}
  </>;
}
