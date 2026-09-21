"use client";

import { useActionState, useId } from "react";
import { createFollowup, updateFollowup } from "./actions";
import type { PastoralFollowupRow } from "@/types/database";

type Followup = Pick<PastoralFollowupRow, "id" | "followup_type" | "occurred_at" | "summary" | "next_action" | "next_action_date" | "status" | "is_sensitive">;

function ministryDateTime(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value)).replace(" ", "T");
}

export function FollowupForm({ studentId, followup }: { studentId: string; followup?: Followup }) {
  const prefix = useId();
  const [state, action, pending] = useActionState(followup ? updateFollowup.bind(null, followup.id) : createFollowup, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="student_id" value={studentId} />
      <div><label className="label" htmlFor={`${prefix}-type`}>Tipo</label><select className="input" id={`${prefix}-type`} name="followup_type" defaultValue={followup?.followup_type ?? "conversation"}><option value="conversation">Conversa</option><option value="phone_call">Ligação</option><option value="whatsapp">WhatsApp</option><option value="family_contact">Contato familiar</option><option value="visit">Visita</option><option value="prayer">Oração</option><option value="other">Outro</option></select></div>
      <div><label className="label" htmlFor={`${prefix}-occurred`}>Quando ocorreu (horário de Brasília)</label><input className="input" id={`${prefix}-occurred`} name="occurred_at" type="datetime-local" defaultValue={followup ? ministryDateTime(followup.occurred_at) : ""} required /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor={`${prefix}-summary`}>Resumo autorizado</label><textarea className="input min-h-24" id={`${prefix}-summary`} name="summary" defaultValue={followup?.summary} minLength={2} maxLength={2000} required /></div>
      <div><label className="label" htmlFor={`${prefix}-next`}>Próxima ação</label><input className="input" id={`${prefix}-next`} name="next_action" defaultValue={followup?.next_action ?? ""} maxLength={500} /></div>
      <div><label className="label" htmlFor={`${prefix}-date`}>Data da próxima ação</label><input className="input" id={`${prefix}-date`} name="next_action_date" type="date" defaultValue={followup?.next_action_date ?? ""} /></div>
      <div><label className="label" htmlFor={`${prefix}-status`}>Status do acompanhamento</label><select className="input" id={`${prefix}-status`} name="status" defaultValue={followup?.status ?? "open"}><option value="open">Em aberto</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select></div>
      <label className="flex min-h-12 items-center gap-3 text-sm"><input type="checkbox" name="is_sensitive" className="size-5" defaultChecked={followup?.is_sensitive} /> Marcar como conteúdo sensível</label>
      {state?.error && <p role="alert" className="text-red-700 sm:col-span-2">{state.error}</p>}
      {state?.success && <p role="status" className="text-emerald-700 sm:col-span-2">Acompanhamento salvo.</p>}
      <div className="sm:col-span-2"><button className="button-primary" disabled={pending}>{pending ? "Salvando…" : followup ? "Salvar alterações" : "Registrar acompanhamento"}</button></div>
    </form>
  );
}
