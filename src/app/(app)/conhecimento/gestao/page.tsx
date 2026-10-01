import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireStaff } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { LearningUnavailable } from "@/features/learning/catalog";
import { CommandForm } from "@/features/learning/command-form";
import { createClient } from "@/lib/supabase/server";
import { followUpFilters, LearnerFollowUp, type FollowUpFilter } from "@/features/learning/learner-follow-up";

const labels = { draft: "Rascunho", in_review: "Em revisão", approved: "Aprovado", published: "Publicado", archived: "Arquivado" };
export default async function LearningManagementPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const actor = await requireStaff();
  const { filtro } = await searchParams;
  const filter: FollowUpFilter = filtro && filtro in followUpFilters ? filtro as FollowUpFilter : "todos";
  const supabase = await createClient();
  const [{ data, error }, { data: tests }] = await Promise.all([
    getLearningSnapshot(actor.ministryId),
    supabase.from("students").select("id").eq("ministry_id", actor.ministryId).eq("is_test", true),
  ]);
  const testIds = new Set((tests ?? []).map((row) => row.id));
  if (error || !data) return <LearningUnavailable />;
  const publication = data.publication;
  const admin = actor.role === "admin";
  const students = data.students;
  // Test records stay visible for rehearsal but never count in the ministry totals.
  const active = students.filter((student) => student.enrollment?.is_active && !testIds.has(student.id));
  const readyForEnrollments = publication?.state === "published";
  const measurable = readyForEnrollments && active.length > 0;
  return <><PageHeading eyebrow="Minha Jornada · liderança" title="Conteúdo e acompanhamento" description="Mundo 1 — Você faz parte! · versão 1. Progresso digital separado da presença EBD." />
    <Link className="button-secondary mb-5" href="/trilhas/fundamentos/voce-faz-parte">Ler conteúdo completo e gabaritos</Link>
    <section className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <article className="card p-6">
        <p className="text-sm font-black uppercase tracking-[.14em] text-[#176b49]">Liberação do teste</p>
        <h2 className="mt-2 text-xl font-black">Como o progresso começa a ser medido</h2>
        <ol className="mt-4 grid gap-3 text-sm leading-6">
          <li className={publication ? "font-semibold text-[#176b49]" : ""}>1. Administrador define autor e revisor.</li>
          <li className={publication?.state === "in_review" || publication?.state === "approved" || publication?.state === "published" ? "font-semibold text-[#176b49]" : ""}>2. Autor envia, revisor aprova e administrador publica o Mundo 1.</li>
          <li className={readyForEnrollments ? "font-semibold text-[#176b49]" : ""}>3. Administrador autoriza inscrição de adolescentes com conta vinculada.</li>
          <li className={measurable ? "font-semibold text-[#176b49]" : ""}>4. O adolescente entra com perfil de aluno e conclui leituras, escolha, quiz, revisão e prática.</li>
          <li>5. XP só aparece quando o banco grava eventos educacionais únicos; a prática final exige validação adulta.</li>
        </ol>
      </article>
      <article className="rounded-2xl border border-[#dfe6df] bg-[#103d2c] p-6 text-white">
        <p className="text-sm font-black uppercase tracking-[.14em] text-[#e6c861]">Estado atual</p>
        <h2 className="mt-2 text-2xl font-black">{measurable ? "Medição ativa" : readyForEnrollments ? "Pronto para inscrever" : "Ainda sem medição"}</h2>
        <p className="mt-3 text-sm leading-6 text-[#d7eadf]">{measurable ? "Já existem inscrições ativas. O progresso muda quando o adolescente executa as missões." : readyForEnrollments ? "O conteúdo está publicado. Autorize pelo menos uma inscrição para testar progresso real." : "Publique o Mundo 1 antes de tentar medir progresso. Sem publicação e inscrição, não há XP nem etapas registradas."}</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-black">{active.length}</p><p>inscrições</p></div>
          <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-black">{active.filter((s) => s.enrollment?.completed_at).length}</p><p>conclusões</p></div>
          <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-black">{active.filter((s) => s.enrollment?.practice_state === "pending").length}</p><p>práticas</p></div>
        </div>
      </article>
    </section>
    <section className="card p-6"><h2 className="text-xl font-black">Revisão e publicação</h2><p className="my-3 font-semibold">{publication ? labels[publication.state] : "Defina os responsáveis para iniciar"}</p>
      <p className="mb-4 text-sm leading-6">O administrador designa dois adultos autorizados. O autor assume a responsabilidade editorial pela versão; o revisor deve ser pessoa diferente e formalmente autorizada para a revisão doutrinária. A publicação libera somente esta versão para inscrições autorizadas.</p>
      {publication && <p className="mb-4 text-sm">Autor: {data.editors.find((editor) => editor.id === publication.author_id)?.name ?? "Vínculo indisponível"} · Revisor: {data.editors.find((editor) => editor.id === publication.reviewer_id)?.name ?? "Vínculo indisponível"}</p>}
      {publication?.review_note && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm">Última orientação editorial: {publication.review_note}</p>}
      {admin && (!publication || publication.state === "draft") && <CommandForm command="configure" label="Salvar responsáveis"><label className="label">Autor/editor responsável<select className="input mt-2" name="author" required defaultValue={publication?.author_id ?? ""}><option value="" disabled>Selecione</option>{data.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.name}</option>)}</select></label><label className="label">Revisor autorizado<select className="input mt-2" name="reviewer" required defaultValue={publication?.reviewer_id ?? ""}><option value="" disabled>Selecione outra pessoa</option>{data.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.name}</option>)}</select></label></CommandForm>}
      {publication?.state === "draft" && publication.author_id === actor.userId && <div className="mt-4"><CommandForm command="submit_review" label="Enviar versão para revisão" /></div>}
      {publication?.state === "in_review" && publication.reviewer_id === actor.userId && <div className="mt-4 grid gap-5"><CommandForm command="approve" label="Aprovar conteúdo e critérios"><label className="flex gap-3 text-sm leading-6"><input type="checkbox" name="confirmed" required />Revisei os textos e contextos bíblicos, faixa etária, respostas explicadas, prática segura, inclusão e regras de conclusão/XP desta versão.</label></CommandForm><CommandForm command="reject" label="Devolver para revisão"><label className="label">Motivo editorial, sem dados pessoais<textarea name="note" required minLength={10} maxLength={300} className="input mt-2" /></label></CommandForm></div>}
      {admin && (publication?.state === "in_review" || publication?.state === "approved") && <div className="mt-4"><CommandForm command="recall" label="Retornar para rascunho"><p className="text-sm">Use quando o revisor designado não puder concluir a revisão. A versão volta a rascunho para redefinir os responsáveis; a aprovação anterior é descartada.</p><label className="label">Motivo editorial, sem dados pessoais<textarea name="note" required minLength={10} maxLength={300} className="input mt-2" /></label></CommandForm></div>}
      {admin && publication?.state === "approved" && <CommandForm command="publish" label="Publicar para o piloto autorizado"><label className="flex gap-3 text-sm leading-6"><input type="checkbox" name="confirmed" required />Confirmo a autorização da liderança para o piloto, a revisão independente e os critérios educacionais desta versão.</label></CommandForm>}
      {admin && publication?.state === "published" && <CommandForm command="archive" label="Arquivar publicação e suspender novas atividades"><p className="text-sm">O arquivamento preserva o histórico. A retomada exigirá uma nova versão editorial.</p></CommandForm>}
      {publication?.state === "archived" && <p className="text-sm">Histórico preservado. Prepare uma nova versão antes de reabrir o conteúdo.</p>}
    </section>
    {data.content && <LearnerFollowUp data={data} content={data.content} testIds={testIds} filter={filter} admin={admin} />}
  </>;
}
