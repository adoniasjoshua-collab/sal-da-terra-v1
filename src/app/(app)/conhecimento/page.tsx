import { PageHeading } from "@/components/page-heading";
import { requireAuth } from "@/lib/auth";

const lessons = [
  { number: 1, title: "Por que lemos a Bíblia?", description: "A centralidade das Escrituras no aprendizado e na prática cristã.", references: "2 Timóteo 3:16–17 · Salmo 119:105 · João 17:17" },
  { number: 2, title: "Como observar o texto com responsabilidade", description: "Observar, compreender, aplicar e orar sem retirar a passagem do seu contexto.", references: "Atos 17:11 · Lucas 24:27 · 2 Pedro 1:20–21" },
  { number: 3, title: "Praticando a Palavra", description: "Relacionar o aprendizado bíblico às decisões e ao serviço cotidiano.", references: "Tiago 1:22–25 · Mateus 7:24–25 · Colossenses 3:17" },
] as const;

export default async function KnowledgeHubPage() {
  const actor = await requireAuth();
  const isStaff = actor.role !== "student";
  return <>
    <PageHeading eyebrow="Minha Jornada" title="Hub de Conhecimento" description="Bíblia, compreensão e prática para viver como embaixadores de Cristo." />
    <p className="mb-6 rounded-xl border border-[#d7e6dc] bg-[#edf7f1] p-4 text-sm leading-6 text-[#365747]">O progresso deste Hub representará somente atividades educacionais realizadas. Nunca será uma nota de fé, espiritualidade, santidade ou avivamento.</p>

    <section className="card overflow-hidden" aria-labelledby="module-one-title">
      <div className="bg-[#143d2c] p-6 text-white sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-[.16em] text-[#9ed6b9]">Fundamentos da Fé · Módulo 1</p><span className="badge bg-[#e6c861] text-[#19382b]">Aprovado · em preparação</span></div><h2 id="module-one-title" className="mt-3 text-3xl font-black">Conhecendo a Bíblia</h2><p className="mt-2 text-lg text-white/75">A Palavra que guia</p><div className="mt-5 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/10 px-3 py-1.5">3 aulas</span><span className="rounded-full bg-white/10 px-3 py-1.5">2 horas</span><span className="rounded-full bg-white/10 px-3 py-1.5">12–17 anos</span></div></div>
      <div className="p-5 sm:p-8"><h3 className="text-xl font-black">O que você aprenderá</h3><p className="mt-2 max-w-3xl leading-7 text-[#526158]">Entender por que a Bíblia orienta a vida cristã, observar uma passagem em seu contexto e reconhecer aplicações responsáveis para a igreja, escola, faculdade, trabalho e comunidade.</p>
        <div className="mt-6 grid gap-3">{lessons.map((lesson) => <article className="rounded-xl border border-[#dfe6df] p-4 sm:flex sm:items-start sm:gap-4" key={lesson.number}><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e3efe7] font-black text-[#176b49]">{lesson.number}</span><div className="mt-3 sm:mt-0"><h4 className="font-black">{lesson.title}</h4><p className="mt-1 text-sm leading-6 text-[#526158]">{lesson.description}</p><p className="mt-2 text-xs font-semibold text-[#176b49]">{lesson.references}</p></div></article>)}</div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2"><article className="rounded-xl bg-[#f5f7f3] p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-[#647268]">Conclusão planejada</p><ul className="mt-3 list-disc space-y-2 pl-5 text-sm"><li>Três aulas e leituras obrigatórias.</li><li>Quiz final com 70% e novas tentativas.</li><li>Missão prática de leitura durante cinco dias.</li></ul></article><article className="rounded-xl border border-[#e6c861] bg-[#fffbed] p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-[#8a6a00]">Reconhecimento</p><h3 className="mt-2 font-black">🏅 Praticante da Palavra</h3><p className="mt-2 text-sm leading-6 text-[#65582d]">Ao concluir os requisitos, o aluno receberá medalha privada e certificado nominal do módulo, sem avaliação de espiritualidade.</p></article></div>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>{isStaff ? "Próxima etapa da liderança:" : "Conteúdo em preparação:"}</strong> {isStaff ? "cadastrar a versão aprovada no banco, revisar textos, mídia e questões e então abrir um piloto fechado." : "as aulas serão liberadas somente depois da revisão final dos textos, mídias e atividades."}</div>
      </div>
    </section>
  </>;
}
