import Link from "next/link";
import { getLearningSnapshot } from "@/features/learning/data";
import { CommandForm } from "@/features/learning/command-form";

// Render only within an administrator-authorized student page.
export async function StudentLearningAccess({ studentId, ministryId, isTest, accessReady }: {
  studentId: string; ministryId: string; isTest: boolean; accessReady: boolean;
}) {
  const { data, error } = await getLearningSnapshot(ministryId);
  const student = data?.students.find((item) => item.id === studentId);
  const enrolled = student?.enrollment?.is_active;
  const published = data?.publication?.state === "published";
  return <section className="card mt-5 p-5 sm:p-6" id="conhecimento-aluno">
    <p className="text-sm font-bold text-[#176b49]">PRÓXIMO PASSO · CONHECIMENTO</p>
    <h2 className="mt-2 text-xl font-black">Mundo 1 — Você faz parte!</h2>
    <p className="mt-2 text-sm leading-6">O convite permite entrar no portal. A inscrição abaixo libera o primeiro módulo para esta conta.</p>
    {error || !data ? <p role="alert" className="mt-4 text-sm text-red-800">Não foi possível conferir a liberação do módulo. Atualize a página ou abra a gestão de Conhecimento antes de enviar o convite.</p>
      : !published ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm">{data.publication?.state === "approved" ? "Conteúdo aprovado. Falta o administrador confirmar a publicação na gestão de Conhecimento." : "O módulo ainda não está publicado para alunos. Confira a revisão e a publicação na gestão de Conhecimento."}</p>
      : !accessReady ? <p className="mt-4 text-sm">Crie ou reative o acesso ao portal acima para liberar a inscrição.</p>
      : enrolled ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900">Inscrição ativa. Após criar a senha, o aluno pode abrir Conhecimento e começar o Mundo 1.</p>
      : student ? <div className="mt-4"><CommandForm command="enroll" target={studentId} label={student.enrollment ? "Reativar inscrição no primeiro módulo" : "Inscrever no primeiro módulo"}>
        <label className="flex gap-3 text-sm leading-6"><input type="checkbox" name="confirmed" required />{isTest ? "Confirmo que esta conta é fictícia e será usada pela administração para testar a jornada." : "Confirmei a autorização e a ciência dos responsáveis conforme a política de proteção do ministério."}</label>
      </CommandForm></div> : <p className="mt-4 text-sm">Reative o cadastro do aluno antes de inscrever.</p>}
    <div className="mt-4 flex flex-wrap gap-3"><Link className="button-secondary" href="/conhecimento/gestao">Gerenciar publicação e inscrições</Link><Link className="button-secondary" href="/trilhas/fundamentos/voce-faz-parte/simulacao">Ver como aluno (simulação)</Link></div>
    {isTest && <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Gere e copie o link de acesso acima.</li><li>Com o módulo publicado, confirme a inscrição nesta ficha.</li><li>Abra uma janela anônima, cole o link e crie a senha do aluno de teste.</li><li>Na conta do aluno, abra Conhecimento → Explorar a trilha → Você faz parte!.</li><li>Mantenha sua janela de administrador aberta para acompanhar o progresso e validar a prática.</li></ol>}
  </section>;
}
