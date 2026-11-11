"use client";

import { useActionState, useState } from "react";
import { createQuickAccess, createStudentAccess, reissueAccessCode, reissueStudentAccess, type AccessState } from "./actions";
import type { QuickAccessInfo } from "./data";

type Props = {
  studentId: string;
  status: "none" | "pending" | "active" | "inactive" | "unavailable";
  email: string | null;
  configured: boolean;
  isTest: boolean;
  suggestedUsername: string;
  quick?: QuickAccessInfo;
};

const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

function ShareButtons({ state }: { state: NonNullable<AccessState> }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const content = state.message ?? state.link ?? "";
  const text = encodeURIComponent(content);
  return <>
    <div className="flex flex-wrap gap-3">
      <button type="button" className="button-primary" onClick={async () => {
        try { await navigator.clipboard.writeText(content); setCopied(true); setCopyError(false); }
        catch { setCopied(false); setCopyError(true); }
      }}>{copied ? "Mensagem copiada" : "Copiar mensagem"}</button>
      {state.whatsapp && <a className="button-secondary" href={`https://wa.me/${state.whatsapp}?text=${text}`} target="_blank" rel="noopener noreferrer">WhatsApp do responsável</a>}
      <a className="button-secondary" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer">WhatsApp (escolher contato)</a>
    </div>
    {copyError && <p role="alert" className="text-sm">Não foi possível copiar automaticamente. Selecione e copie os dados acima.</p>}
  </>;
}

export function CodeResult({ state }: { state: AccessState }) {
  if (!state?.code || !state.username || !state.expiresAt) return null;
  return <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
    <p className="font-bold text-emerald-900">Acesso rápido gerado</p>
    <dl className="grid gap-2 text-emerald-950 sm:grid-cols-2">
      <div><dt className="text-xs font-bold uppercase tracking-wide">Usuário</dt><dd className="font-mono text-lg font-black">{state.username}</dd></div>
      <div><dt className="text-xs font-bold uppercase tracking-wide">Código temporário</dt><dd className="font-mono text-lg font-black">{state.code}</dd></div>
    </dl>
    <p className="text-sm leading-6 text-emerald-950">Vale até {dateTime.format(new Date(state.expiresAt))}. No primeiro acesso o aluno cria a própria senha. Envie somente ao adolescente ou ao responsável. O código não volta a ser exibido; se perder, gere outro.</p>
    <ShareButtons state={state} />
  </div>;
}

const statusLabels = {
  none: "Sem acesso ao portal",
  pending: "Conta criada, aguardando confirmação do aluno",
  active: "Acesso ativo",
  inactive: "Acesso desativado",
  unavailable: "Não foi possível confirmar a situação do acesso",
};

export function LinkResult({ state, audience = "student" }: { state: AccessState; audience?: "student" | "staff" }) {
  if (!state?.link) return null;
  return <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
    <p className="font-bold text-emerald-900">Link de acesso gerado</p>
    <p className="text-sm leading-6 text-emerald-950">{audience === "staff" ? "Envie somente à pessoa convidada." : "Envie somente ao adolescente ou ao responsável."} O link é pessoal, vale uma vez e expira conforme a configuração do Supabase. Se expirar, gere outro.</p>
    <input className="input font-mono text-xs" readOnly value={state.link} aria-label="Link de acesso" onFocus={(event) => event.currentTarget.select()} />
    <ShareButtons state={state} />
  </div>;
}

const operations = {
  quick: createQuickAccess,
  "reissue-code": reissueAccessCode,
  reissue: reissueStudentAccess,
  email: createStudentAccess,
} as const;

function codeStatus(quick: QuickAccessInfo) {
  if (quick.codeState === "active" && quick.expiresAt) return `Código temporário válido até ${dateTime.format(new Date(quick.expiresAt))}; o aluno ainda não criou a senha.`;
  if (quick.codeState === "expired") return "Código expirado sem uso. Gere um novo código para o aluno entrar.";
  return "O aluno já criou a própria senha.";
}

export function StudentAccessPanel({ studentId, status, email, configured, isTest, suggestedUsername, quick }: Props) {
  const [emailInput, setEmailInput] = useState("");
  const [username, setUsername] = useState(suggestedUsername);
  const [state, action, pending] = useActionState<AccessState, FormData>((previous, formData) => {
    const operation = String(formData.get("operation") ?? "email") as keyof typeof operations;
    return (operations[operation] ?? createStudentAccess)(previous, formData);
  }, undefined);
  const created = Boolean(state?.link || state?.code);
  const hasAccount = status !== "none" || created;
  const isQuick = Boolean(quick || state?.code);
  const disabled = !configured || pending;

  return <section className="card mt-7 p-5 sm:p-6" id="acesso" aria-labelledby="acesso-title">
    <h2 id="acesso-title" className="text-xl font-black">Acesso do aluno ao portal</h2>
    <p className="mt-1 text-sm text-[#647268]">O aluno entra no mesmo endereço da liderança, mas vê somente a própria participação e a Minha Jornada. Nenhum dado pastoral é exibido.</p>
    <p className="mt-4 font-bold">
      {status === "none" && created ? (state?.code ? "Acesso por usuário criado" : statusLabels.pending) : quick ? "Acesso por usuário" : statusLabels[status]}
      {email && <span className="font-normal text-[#647268]"> · {email}</span>}
      {(quick?.username ?? state?.username) && <span className="font-normal text-[#647268]"> · usuário <span className="font-mono">{quick?.username ?? state?.username}</span></span>}
    </p>
    {quick && !state?.code && <p className="mt-1 text-sm text-[#647268]">{codeStatus(quick)}</p>}
    {isTest && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Aluno de teste: gere o acesso rápido e entre numa janela anônima com o usuário e o código para ver exatamente o que o aluno verá.</p>}
    {!configured && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Configuração pendente: a variável SUPABASE_SERVICE_ROLE_KEY não está definida no servidor. Sem ela não é possível gerar acessos.</p>}

    {!hasAccount && <>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <input type="hidden" name="operation" value="quick" />
        <input type="hidden" name="student_id" value={studentId} />
        <div>
          <label className="label" htmlFor="access-username">Usuário do aluno</label>
          <input className="input font-mono" id="access-username" name="username" required minLength={3} maxLength={40} pattern="[a-z0-9]+(\.[a-z0-9]+)*" autoComplete="off" autoCapitalize="none" spellCheck={false}
            value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} disabled={disabled} aria-describedby="access-username-hint" />
          <p id="access-username-hint" className="mt-1 text-xs text-[#647268]">Sem e-mail: o aluno entra com este usuário e um código temporário de 7 dias. Se já existir, o sistema acrescenta um número.</p>
        </div>
        <button className="button-primary" disabled={disabled}>{pending ? "Gerando…" : "Gerar acesso rápido"}</button>
      </form>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-bold text-[#176b49]">Usar e-mail em vez disso</summary>
        <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <input type="hidden" name="operation" value="email" />
          <input type="hidden" name="student_id" value={studentId} />
          <div><label className="label" htmlFor="access-email">E-mail do aluno ou do responsável</label><input className="input" id="access-email" name="email" type="email" required maxLength={254} autoComplete="off" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} disabled={disabled} /></div>
          <button className="button-secondary" disabled={disabled}>{pending ? "Criando…" : "Criar acesso e gerar link"}</button>
        </form>
      </details>
    </>}

    {hasAccount && status !== "inactive" && status !== "unavailable" && <form action={action} className="mt-4">
      <input type="hidden" name="operation" value={isQuick ? "reissue-code" : "reissue"} />
      <input type="hidden" name="student_id" value={studentId} />
      <button className="button-secondary" disabled={disabled}>{pending ? "Gerando…" : isQuick ? "Gerar novo código" : status === "active" ? "Gerar link para redefinir senha" : "Gerar novo link de convite"}</button>
      {isQuick && <p className="mt-2 text-xs text-[#647268]">Use se o aluno esqueceu a senha ou se o código expirou. O código anterior deixa de valer.</p>}
    </form>}
    {status === "inactive" && <p className="mt-3 text-sm">Confira se o cadastro está ativo em <a className="font-bold text-[#176b49] underline" href={`/adolescentes/${studentId}/editar`}>Editar cadastro</a> e se o vínculo de aluno está ativo em <a className="font-bold text-[#176b49] underline" href="/administracao#access-title">Administração</a>.</p>}
    {status === "unavailable" && <p role="alert" className="mt-3 text-sm">Atualize a página antes de gerar um acesso. Se o problema continuar, peça à administração para verificar a conta vinculada.</p>}

    {state?.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <LinkResult key={state?.link} state={state} />
    <CodeResult key={state?.code} state={state} />
    {hasAccount && <p className="mt-4 text-xs text-[#647268]">Para bloquear o acesso, desative o vínculo em Administração. O histórico é preservado.</p>}
  </section>;
}
