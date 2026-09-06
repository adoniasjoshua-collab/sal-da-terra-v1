"use client";

import { useActionState, useState } from "react";
import { saveHeadcount } from "./actions";

type ExistingHeadcount = {
  adolescent_count: number;
  visitor_count: number;
  is_estimated: boolean;
  notes: string | null;
} | null;

export function HeadcountForm({ eventId, existing }: { eventId: string; existing: ExistingHeadcount }) {
  const action = saveHeadcount.bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [total, setTotal] = useState(existing?.adolescent_count ?? 0);

  return (
    <form action={formAction} className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
      <div className="rounded-xl border border-[#d7e6dc] bg-[#edf7f1] p-4 text-sm leading-6 text-[#365747] sm:col-span-2">
        Registre somente números. Não inclua nomes, contatos ou observações pessoais neste formulário.
      </div>
      <div>
        <label className="label" htmlFor="adolescent_count">Total de adolescentes presentes</label>
        <input className="input" id="adolescent_count" name="adolescent_count" type="number" inputMode="numeric" min="0" max="100000" value={total} onChange={(event) => setTotal(Number(event.target.value))} required />
        <p className="mt-2 text-xs text-[#647268]">Inclua os visitantes neste total.</p>
      </div>
      <div>
        <label className="label" htmlFor="visitor_count">Visitantes dentro do total</label>
        <input className="input" id="visitor_count" name="visitor_count" type="number" inputMode="numeric" min="0" max={Math.max(total, 0)} defaultValue={existing?.visitor_count ?? 0} required />
        <p className="mt-2 text-xs text-[#647268]">Informe zero quando não houver visitantes.</p>
      </div>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#dfe6df] p-3 text-sm sm:col-span-2">
        <input className="size-5" type="checkbox" name="is_estimated" defaultChecked={existing?.is_estimated ?? false} />
        A contagem é uma estimativa
      </label>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Observação operacional (opcional)</label>
        <textarea className="input min-h-20" id="notes" name="notes" maxLength={500} defaultValue={existing?.notes ?? ""} placeholder="Ex.: contagem realizada na entrada; não inserir nomes." />
      </div>
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2">{state.success}</p>}
      <div className="sm:col-span-2"><button className="button-primary w-full sm:w-auto" disabled={pending}>{pending ? "Salvando…" : existing ? "Atualizar contagem" : "Salvar contagem"}</button></div>
    </form>
  );
}
