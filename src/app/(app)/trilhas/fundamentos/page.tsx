import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireAuth } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { LearningUnavailable } from "@/features/learning/catalog";
import { learningProgress } from "@/services/learning";

const worlds = [
  { title: "Você faz parte!", theme: "Pertencimento", xp: 220 },
  { title: "A melhor notícia", theme: "Evangelho", xp: 220 },
  { title: "Quem sou eu em Cristo?", theme: "Identidade", xp: 220 },
  { title: "Decifrando a Palavra", theme: "Bíblia", xp: 220 },
  { title: "Conversa com Deus", theme: "Oração", xp: 220 },
  { title: "O Espírito Santo e a vida cristã", theme: "Vida cristã", xp: 220 },
  { title: "Quem caminha comigo?", theme: "Amizades", xp: 220 },
];

export default async function TrackPage() {
  const actor = await requireAuth();
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  const canRead = Boolean(data?.content);
  const progress = data?.content && data.enrollment ? learningProgress(data.enrollment, data.content) : null;
  const worldOneComplete = Boolean(data?.enrollment?.completed_at);
  const earnedXp = data?.enrollment?.xp ?? 0;
  const totalXp = worlds.reduce((sum, world) => sum + world.xp, 100);

  return <>
    <PageHeading eyebrow="Temporada 01" title="Fundamentos Sal da Terra" description="Sua jornada em mundos curtos, progresso privado e conquistas educacionais." />
    <nav className="mb-6 flex flex-wrap gap-3">
      <Link className="button-secondary" href="/conhecimento">Catálogo</Link>
      <Link className="button-secondary" href={actor.role === "student" ? "/meu-progresso" : "/conhecimento/gestao"}>{actor.role === "student" ? "Meu progresso" : "Gestão da jornada"}</Link>
    </nav>
    {error ? <LearningUnavailable /> : <>
      <section className="overflow-hidden rounded-2xl border border-[#d9e5dd] bg-[#103d2c] text-white shadow-sm">
        <div className="grid gap-5 p-6 sm:grid-cols-[1.3fr_.7fr] sm:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[.16em] text-[#e6c861]">Mapa da temporada</p>
            <h2 className="mt-3 text-3xl font-black">7 mundos + desafio final</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#d7eadf]">Avance no seu ritmo. XP e conquistas registram atividades educacionais, sem ranking público e sem medir fé.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
            <p className="text-sm text-[#d7eadf]">Progresso atual</p>
            <p className="mt-2 text-4xl font-black">{earnedXp}<span className="text-lg text-[#e6c861]"> XP</span></p>
            <div className="mt-4 h-3 rounded-full bg-white/20">
              <div className="h-3 rounded-full bg-[#e6c861]" style={{ width: `${Math.min(100, Math.floor(earnedXp * 100 / totalXp))}%` }} />
            </div>
            <p className="mt-3 text-sm text-[#d7eadf]">{progress ? `${progress.done} de ${progress.total} etapas no Mundo 1` : "Aguardando liberação da primeira missão"}</p>
          </div>
        </div>
      </section>

      {!canRead && <p className="my-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{data?.publication?.state === "published" ? "Converse com a liderança para autorizar sua inscrição nesta jornada." : "O primeiro mundo está em preparação. A liderança avisará quando sua jornada estiver disponível."}</p>}

      <ol className="relative mt-7 grid gap-4 before:absolute before:left-8 before:top-8 before:hidden before:h-[calc(100%-4rem)] before:w-1 before:rounded-full before:bg-[#dfe6df] sm:grid-cols-2 sm:before:block lg:grid-cols-3">
        {worlds.map((world, index) => {
          const active = index === 0 && canRead && !worldOneComplete;
          const complete = index === 0 && worldOneComplete;
          const locked = index > 0 || !canRead;
          return <li className={`relative rounded-2xl border p-5 shadow-sm ${complete ? "border-[#176b49] bg-[#edf7f1]" : active ? "border-[#e6c861] bg-white ring-2 ring-[#e6c861]/40" : "border-[#dfe6df] bg-white"}`} key={world.title}>
            <div className="flex items-start justify-between gap-4">
              <span className={`z-[1] grid size-14 shrink-0 place-items-center rounded-full text-xl font-black ${complete ? "bg-[#176b49] text-white" : active ? "bg-[#e6c861] text-[#19382b]" : "bg-[#eef2ee] text-[#526158]"}`}>{complete ? "✓" : index + 1}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${locked ? "bg-[#f1f4f1] text-[#526158]" : "bg-[#143d2c] text-white"}`}>{complete ? "Concluído" : active ? "Missão ativa" : "Em preparação"}</span>
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[.14em] text-[#176b49]">{world.theme}</p>
            <h2 className="mt-2 text-xl font-black">{world.title}</h2>
            <p className="mt-2 text-sm text-[#526158]">{index === 0 ? "Leituras, escolhas, quiz, revisão e prática validada." : "Conteúdo será liberado em versão revisada."}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-[#405048]">
              <span className="rounded-full bg-[#f5f7f3] px-3 py-1">{world.xp} XP</span>
              <span className="rounded-full bg-[#f5f7f3] px-3 py-1">Conquista</span>
              <span className="rounded-full bg-[#f5f7f3] px-3 py-1">Sem ranking</span>
            </div>
            {index === 0 && canRead && <Link className="button-primary mt-5 w-full" href="/trilhas/fundamentos/voce-faz-parte">{actor.role === "student" ? complete ? "Revisar mundo" : "Começar missão" : "Revisar conteúdo"}</Link>}
          </li>;
        })}
      </ol>

      <section className="mt-5 rounded-2xl border border-dashed border-[#cbd6cd] bg-white p-6">
        <p className="text-sm font-black uppercase tracking-[.14em] text-[#176b49]">Final da temporada</p>
        <h2 className="mt-2 text-xl font-black">Desafio dos Fundamentos</h2>
        <p className="mt-2 text-sm text-[#526158]">Em preparação. O certificado da temporada será disponibilizado após a implementação da trilha completa e homologação dos critérios.</p>
      </section>
    </>}
  </>;
}
