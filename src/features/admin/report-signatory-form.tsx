"use client";

import { useActionState } from "react";
import { saveReportSignatory } from "./actions";
import type { ReportSignatoryRow } from "@/types/database";

export function ReportSignatoryForm({ signatory }: { signatory?: Partial<ReportSignatoryRow> }) {
  const [state, action, pending] = useActionState(saveReportSignatory, undefined);
  const prefix = signatory?.id ?? "new";
  return <form action={action} className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_1fr_90px_auto]">
    {signatory?.id && <input type="hidden" name="id" value={signatory.id} />}
    <div><label className="label" htmlFor={`signer-name-${prefix}`}>Nome completo</label><input className="input" id={`signer-name-${prefix}`} name="full_name" defaultValue={signatory?.full_name ?? ""} required /></div>
    <div><label className="label" htmlFor={`signer-role-${prefix}`}>Função na assinatura</label><input className="input" id={`signer-role-${prefix}`} name="role_title" defaultValue={signatory?.role_title ?? "Liderança de adolescentes"} required /></div>
    <div><label className="label" htmlFor={`signer-phone-${prefix}`}>Celular</label><input className="input" id={`signer-phone-${prefix}`} name="phone" type="tel" defaultValue={signatory?.phone ?? ""} /></div>
    <div><label className="label" htmlFor={`signer-email-${prefix}`}>E-mail</label><input className="input" id={`signer-email-${prefix}`} name="email" type="email" defaultValue={signatory?.email ?? ""} /></div>
    <div><label className="label" htmlFor={`signer-order-${prefix}`}>Ordem</label><input className="input" id={`signer-order-${prefix}`} name="display_order" type="number" min="0" max="20" defaultValue={signatory?.display_order ?? 0} /></div>
    <div className="flex items-end gap-3"><label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={signatory?.is_active ?? true} /> Ativo</label><button className="button-secondary" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button></div>
    {state?.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2 lg:col-span-6">{state.error}</p>}
    {state?.success && <p role="status" className="text-sm text-emerald-700 sm:col-span-2 lg:col-span-6">{state.success}</p>}
  </form>;
}
