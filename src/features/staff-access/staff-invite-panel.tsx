"use client";

import { useActionState } from "react";
import { LinkResult } from "@/features/student-access/student-access-panel";
import type { AccessState } from "@/features/student-access/actions";
import { createStaffAccess, reissueStaffAccess } from "./actions";

type Leader = { memberId: string; name: string };

export function StaffInvitePanel({ leaders, configured }: { leaders: Leader[]; configured: boolean }) {
  const [state, action, pending] = useActionState<AccessState, FormData>(
    (previous, formData) => formData.get("operation") === "reissue" ? reissueStaffAccess(previous, formData) : createStaffAccess(previous, formData),
    undefined,
  );
  return <section className="card mb-6 p-5 sm:p-6" id="convidar-lider" aria-labelledby="staff-invite-title">
    <h2 id="staff-invite-title" className="text-xl font-black">Convidar líder ou revisor</h2>
    <p className="mt-2 text-sm leading-6 text-[#526158]">A pessoa entra como <strong>Líder</strong>: acompanha adolescentes e pode ser escolhida como revisora dos módulos em Conhecimento → Gestão. Para torná-la administradora, altere a função em Controle de acesso depois que ela entrar.</p>
    {!configured && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Configuração pendente: a variável SUPABASE_SERVICE_ROLE_KEY não está definida no servidor. Sem ela não é possível gerar convites.</p>}
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
      <input type="hidden" name="operation" value="create" />
      <div><label className="label" htmlFor="staff-name">Nome completo</label><input className="input" id="staff-name" name="full_name" required minLength={2} maxLength={160} disabled={!configured || pending} /></div>
      <div><label className="label" htmlFor="staff-email">E-mail</label><input className="input" id="staff-email" name="email" type="email" required maxLength={254} autoComplete="off" disabled={!configured || pending} /></div>
      <button className="button-primary" disabled={!configured || pending}>{pending ? "Gerando…" : "Convidar e gerar link"}</button>
    </form>
    {leaders.length > 0 && <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="operation" value="reissue" />
      <div><label className="label" htmlFor="staff-reissue">Novo link para um líder (expirou ou esqueceu a senha)</label><select className="input" id="staff-reissue" name="member_id" required defaultValue="">{[<option key="" value="" disabled>Selecione</option>, ...leaders.map((leader) => <option key={leader.memberId} value={leader.memberId}>{leader.name}</option>)]}</select></div>
      <button className="button-secondary" disabled={!configured || pending}>Gerar novo link</button>
    </form>}
    {state?.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <LinkResult key={state?.link} state={state} audience="staff" />
  </section>;
}
