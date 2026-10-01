import Link from "next/link";
import { CommandForm } from "./command-form";
import { BulkEnrollForm } from "./bulk-enroll-form";
import { learningNextStep, learningProgress, learningStage, practiceLabels, stageLabels, type LearningSnapshot, type LearningStage, type WorldContent } from "@/services/learning";

export const followUpFilters = { todos: "Todos", atencao: "Precisa de atenção", andamento: "Em andamento", concluidos: "Concluídos", "sem-inscricao": "Sem inscrição" } as const;
export type FollowUpFilter = keyof typeof followUpFilters;

const order: LearningStage[] = ["practice_pending", "changes_requested", "not_started", "in_progress", "completed", "not_enrolled"];
const matches: Record<FollowUpFilter, LearningStage[]> = {
  todos: order, atencao: ["practice_pending", "changes_requested", "not_started"], andamento: ["in_progress"],
  concluidos: ["completed"], "sem-inscricao": ["not_enrolled"],
};
const stageStyles: Record<LearningStage, string> = {
  practice_pending: "bg-amber-100 text-amber-950", changes_requested: "bg-orange-100 text-orange-950", not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-900", completed: "bg-emerald-100 text-emerald-900", not_enrolled: "bg-slate-100 text-slate-600",
};
const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

type Props = { data: LearningSnapshot; content: WorldContent; testIds: Set<string>; filter: FollowUpFilter; admin: boolean };

export function LearnerFollowUp({ data, content, testIds, filter, admin }: Props) {
  const published = data.publication?.state === "published";
  const rows = data.students.map((student) => ({ student, stage: learningStage(student.enrollment, content), isTest: testIds.has(student.id) }))
    .sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage) || a.student.name.localeCompare(b.student.name, "pt-BR"));
  const real = rows.filter((row) => !row.isTest);
  const count = (stages: LearningStage[]) => real.filter((row) => stages.includes(row.stage)).length;
  const eligible = real.filter((row) => row.stage === "not_enrolled" && row.student.hasAccount).length;
  const visible = rows.filter((row) => matches[filter].includes(row.stage));

  return <section className="mt-6" aria-labelledby="follow-up-title">
    <h2 id="follow-up-title" className="text-xl font-black">Acompanhamento dos alunos</h2>
    <p className="mt-1 text-sm text-[#526158]">Atividades educacionais do Mundo 1. Não medem fé nem espiritualidade. Alunos de teste aparecem marcados e ficam fora dos totais.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Resumo educacional">
      {([["Inscritos", count(["not_started", "in_progress", "practice_pending", "changes_requested", "completed"])], ["Em andamento", count(["in_progress"])], ["Práticas para validar", count(["practice_pending"])], ["Concluíram", count(["completed"])], ["Ainda não começaram", count(["not_started"])]] as const)
        .map(([label, value]) => <article className="card p-4" key={label}><p className="text-sm text-[#526158]">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></article>)}
    </div>
    {admin && published && <BulkEnrollForm count={eligible} />}
    <nav className="mt-5 flex flex-wrap gap-2" aria-label="Filtrar alunos">
      {(Object.entries(followUpFilters) as [FollowUpFilter, string][]).map(([key, label]) => <Link key={key} href={key === "todos" ? "/conhecimento/gestao#follow-up-title" : `/conhecimento/gestao?filtro=${key}#follow-up-title`} aria-current={filter === key ? "page" : undefined}
        className={`rounded-full border px-4 py-2 text-sm font-bold ${filter === key ? "border-[#176b49] bg-[#176b49] text-white" : "border-[#dfe6df] bg-white"}`}>{label}</Link>)}
    </nav>
    {visible.length === 0 ? <p className="card mt-4 p-6">Nenhum aluno neste filtro.</p> : <div className="mt-4 grid gap-4">{visible.map(({ student, stage, isTest }) => {
      const enrollment = student.enrollment?.is_active ? student.enrollment : null;
      const progress = enrollment ? learningProgress(enrollment, content) : null;
      const readings = enrollment ? content.cards.filter((card) => enrollment.readings.includes(card.id)).length : 0;
      const steps = enrollment ? [[`Leituras ${readings}/${content.cards.length}`, readings === content.cards.length], ["Escolha", enrollment.exercise_done], ["Quiz", enrollment.quiz_passed], ["Revisão", enrollment.summary_done], ["Prática", enrollment.practice_state === "approved"]] as const : [];
      return <article className="card p-5" key={student.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="text-lg font-bold">{student.name}{isTest && <span className="badge ml-2 bg-amber-100 text-amber-950">TESTE</span>}</h3>
            {enrollment && <p className="mt-1 text-sm text-[#526158]">Próximo passo: <strong>{learningNextStep(enrollment, content)}</strong>{enrollment.updated_at && ` · Última atividade: ${when.format(new Date(enrollment.updated_at))}`}</p>}</div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${stageStyles[stage]}`}>{stageLabels[stage]}</span>
        </div>
        {enrollment && progress && <>
          <div className="mt-4 flex items-center gap-3"><div className="h-2.5 flex-1 rounded-full bg-[#e7ece8]"><div className="h-2.5 rounded-full bg-[#176b49]" style={{ width: `${progress.percent}%` }} /></div><p className="text-sm font-bold">{progress.percent}% · {enrollment.xp} XP</p></div>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs font-bold">{steps.map(([label, done]) => <li key={label} className={`rounded-full px-3 py-1 ${done ? "bg-emerald-50 text-emerald-900" : "bg-[#f5f7f3] text-[#526158]"}`}>{done ? "✓ " : ""}{label}</li>)}</ul>
          {enrollment.last_quiz && <p className="mt-2 text-sm">Última tentativa do quiz: {enrollment.last_quiz.correctCount}/{enrollment.last_quiz.total} acertos.</p>}
          {enrollment.practice_state !== "not_requested" && <p className="mt-2 text-sm">{practiceLabels[enrollment.practice_state]}</p>}
          {enrollment.review_note && <p className="mt-2 text-sm">Última justificativa educacional: {enrollment.review_note}</p>}
          {enrollment.practice_state === "pending" && published && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="mb-3 text-sm font-bold">O aluno pediu a validação da prática</p><CommandForm command="review_practice" target={enrollment.id} label="Registrar decisão"><label className="label">Forma de realização<select name="mode" className="input mt-2"><option value="supervised">Atividade supervisionada</option><option value="equivalent">Alternativa educacional equivalente</option></select></label><label className="label">Decisão<select name="decision" className="input mt-2"><option value="approved">Validar realização</option><option value="changes_requested">Combinar ajuste com o adolescente</option></select></label><label className="label">Justificativa educacional<textarea className="input mt-2" name="note" required minLength={10} maxLength={300} placeholder="Registre somente o necessário para validar a atividade, sem nomes de terceiros ou informação pastoral." /></label></CommandForm></div>}
          {Boolean(enrollment.reviews?.length) && <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold">Histórico de validações</summary><ul className="mt-3 space-y-3">{enrollment.reviews?.map((review, index) => <li key={index}>{review.decision === "approved" ? "Validada" : "Ajuste solicitado"} · {review.mode === "equivalent" ? "Alternativa equivalente" : "Supervisionada"} · {when.format(new Date(review.created_at))}<p>{review.note}</p></li>)}</ul></details>}
          {admin && <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-[#647268]">Desativar inscrição</summary><div className="mt-3"><CommandForm command="withdraw" target={enrollment.id} label="Desativar inscrição, preservando histórico" /></div></details>}
        </>}
        {!enrollment && (admin && published && student.hasAccount
          ? <div className="mt-3"><CommandForm command="enroll" target={student.id} label={student.enrollment ? "Reativar inscrição" : "Autorizar inscrição"}><label className="flex gap-3 text-sm leading-6"><input type="checkbox" name="confirmed" required />{isTest ? "Confirmo que esta conta é fictícia e será usada pela administração para testar a jornada." : "Confirmei a autorização e a ciência dos responsáveis conforme a política de proteção adotada pelo ministério."}</label></CommandForm></div>
          : <p className="mt-2 text-sm">{!student.hasAccount ? "Ainda não tem acesso ao portal." : published ? "Aguardando inscrição pelo administrador." : "A inscrição abre depois da publicação do Mundo 1."}</p>)}
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold"><Link className="text-[#176b49] underline" href={`/adolescentes/${student.id}`}>Abrir ficha</Link>{admin && !student.hasAccount && <Link className="text-[#176b49] underline" href={`/adolescentes/${student.id}/editar#acesso`}>Criar acesso do aluno</Link>}</div>
      </article>;
    })}</div>}
  </section>;
}
