"use client";

import { useActionState, useState } from "react";
import { createStudentAccess, reissueStudentAccess, type AccessState } from "./actions";

type Props = {
  studentId: string;
  status: "none" | "pending" | "active" | "inactive" | "unavailable";
  email: string | null;
  configured: boolean;
  isTest: boolean;
};

const statusLabels = {
  none: "Sem acesso ao portal",
  pending: "Conta criada, aguardando confirmação do aluno",
  active: "Acesso ativo",
  inactive: "Acesso desativado",
  unavailable: "Não foi possível confirmar a situação do acesso",
};

export function LinkResult({ state, audience = "student" }: { state: AccessState; audience?: "student" | "staff" }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  if (!state?.link) return null;
  const text = encodeURIComponent(state.message ?? state.link);
  return <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
    <p className="font-bold text-emerald-900">Link de acesso gerado</p>
    <p className="text-sm leading-6 text-emerald-950">{audience === "staff" ? "Envie somente à pessoa convidada." : "Envie somente ao adolescente ou ao responsável."} O link é pessoal, vale uma vez e expira conforme a configuração do Supabase. Se expirar, gere outro.</p>
    <input className="input font-mono text-xs" readOnly value={state.link} aria-label="Link de acesso" onFocus={(event) => event.currentTarget.select()} />
    <div className="flex flex-wrap gap-3">
      <button type="button" className="button-primary" onClick={async () => {
        try { await navigator.clipboard.writeText(state.message ?? state.link!); setCopied(true); setCopyError(false); }
        catch { setCopied(false); setCopyError(true); }
      }}>{copied ? "Mensagem copiada" : "Copiar mensagem com link"}</button>
      {state.whatsapp && <a className="button-secondary" href={`https://wa.me/${state.whatsapp}?text=${text}`} target="_blank" rel="noopener noreferrer">WhatsApp do responsável</a>}
      <a className="button-secondary" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer">WhatsApp (escolher contato)</a>
    </div>
    {copyError && <p role="alert" className="text-sm">Não foi possível copiar automaticamente. Selecione e copie o link no campo acima.</p>}
  </div>;
}

export function StudentAccessPanel({ studentId, status, email, configured, isTest }: Props) {
  const [emailInput, setEmailInput] = useState("");
  const [state, action, pending] = useActionState<AccessState, FormData>(
    (previous, formData) => formData.get("operation") === "reissue"
      ? reissueStudentAccess(previous, formData)
      : createStudentAccess(previous, formData),
    undefined,
  );
  const hasAccount = status !== "none" || Boolean(state?.link);

  return <section className="card mt-7 p-5 sm:p-6" id="acesso" aria-labelledby="acesso-title">
    <h2 id="acesso-title" className="text-xl font-black">Acesso do aluno ao portal</h2>
    <p className="mt-1 text-sm text-[#647268]">O aluno entra no mesmo endereço da liderança, mas vê somente a própria participação e a Minha Jornada. Nenhum dado pastoral é exibido.</p>
    <p className="mt-4 font-bold">{status === "none" && state?.link ? statusLabels.pending : statusLabels[status]}{email && <span className="font-normal text-[#647268]"> · {email}</span>}</p>
    {isTest && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Aluno de teste: use um e-mail seu com apelido (ex.: seunome+aluno@gmail.com) e abra o link numa janela anônima para ver exatamente o que o aluno verá.</p>}
    {!configured && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Configuração pendente: a variável SUPABASE_SERVICE_ROLE_KEY não está definida no servidor. Sem ela não é possível gerar convites.</p>}

    {!hasAccount && <form action={action} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <input type="hidden" name="student_id" value={studentId} />
      <div><label className="label" htmlFor="access-email">E-mail do aluno ou do responsável</label><input className="input" id="access-email" name="email" type="email" required maxLength={254} autoComplete="off" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} disabled={!configured || pending} /></div>
      <button className="button-primary" disabled={!configured || pending}>{pending ? "Criando…" : "Criar acesso e gerar link"}</button>
    </form>}

    {hasAccount && status !== "inactive" && status !== "unavailable" && <form action={action} className="mt-4">
      <input type="hidden" name="operation" value="reissue" />
      <input type="hidden" name="student_id" value={studentId} />
      <button className="button-secondary" disabled={!configured || pending}>{pending ? "Gerando…" : status === "active" ? "Gerar link para redefinir senha" : "Gerar novo link de convite"}</button>
    </form>}
    {status === "inactive" && <p className="mt-3 text-sm">Confira se o cadastro está ativo em <a className="font-bold text-[#176b49] underline" href={`/adolescentes/${studentId}/editar`}>Editar cadastro</a> e se o vínculo de aluno está ativo em <a className="font-bold text-[#176b49] underline" href="/administracao#access-title">Administração</a>.</p>}
    {status === "unavailable" && <p role="alert" className="mt-3 text-sm">Atualize a página antes de gerar um convite. Se o problema continuar, peça à administração para verificar a conta vinculada.</p>}

    {state?.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <LinkResult key={state?.link} state={state} />
    {hasAccount && <p className="mt-4 text-xs text-[#647268]">Para bloquear o acesso, desative o vínculo em Administração. O histórico é preservado.</p>}
  </section>;
}
