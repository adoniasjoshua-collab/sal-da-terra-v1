import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireAuth } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { LearningUnavailable } from "@/features/learning/catalog";

const worlds = ["Você faz parte!", "A melhor notícia", "Quem sou eu em Cristo?", "Decifrando a Palavra", "Conversa com Deus", "O Espírito Santo e a vida cristã", "Quem caminha comigo?"];
export default async function TrackPage() {
  const actor = await requireAuth();
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  const canRead = Boolean(data?.content);
  return <><PageHeading eyebrow="Temporada 01" title="Fundamentos Sal da Terra" description="Pertencer, compreender e cuidar. Siga a ordem sugerida e volte para revisar quando quiser." /><nav className="mb-6 flex flex-wrap gap-3"><Link className="button-secondary" href="/conhecimento">Catálogo</Link><Link className="button-secondary" href={actor.role === "student" ? "/meu-progresso" : "/conhecimento/gestao"}>{actor.role === "student" ? "Meu progresso" : "Gestão da jornada"}</Link></nav>
    {error ? <LearningUnavailable /> : <>
      {!canRead && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{data?.publication?.state === "published" ? "Converse com a liderança para autorizar sua inscrição nesta jornada." : "O primeiro mundo está em preparação. A liderança avisará quando sua jornada estiver disponível."}</p>}
      <ol className="grid gap-4 sm:grid-cols-2">{worlds.map((title, index) => <li className="card p-6" key={title}><span className="grid size-12 place-items-center rounded-full bg-[#e3efe7] text-xl font-black text-[#176b49]">{index + 1}</span><h2 className="mt-4 text-xl font-black">{title}</h2>{index === 0 && canRead ? <><p className="mt-2 text-sm">{data?.enrollment?.completed_at ? "Concluído · você pode revisar" : actor.role === "student" ? "Leituras, escolhas e acolhimento" : "Prévia editorial disponível"}</p><Link className="button-primary mt-4" href="/trilhas/fundamentos/voce-faz-parte">{actor.role === "student" ? "Abrir mundo" : "Revisar conteúdo"}</Link></> : <p className="mt-3 text-sm text-[#526158]">{index === 0 && data?.publication?.state === "published" ? "Disponível mediante inscrição" : "Em preparação"}</p>}</li>)}</ol><section className="card mt-5 border-dashed p-6"><h2 className="text-xl font-black">Desafio dos Fundamentos</h2><p className="mt-2 text-sm">Em preparação. O certificado da temporada será disponibilizado após a implementação da trilha completa e homologação dos critérios.</p></section>
    </>}
  </>;
}
