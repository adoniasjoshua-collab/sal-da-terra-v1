"use client";

import { useActionState } from "react";
import { enrollAllEligible } from "./actions";

export function BulkEnrollForm({ count }: { count: number }) {
  const [state, action, pending] = useActionState(enrollAllEligible, undefined);
  return <form action={action} className="mt-4 grid gap-3 rounded-xl border border-[#dfe6df] bg-[#f5f7f3] p-4">
    <p className="font-bold">{count} aluno(s) com conta aguardando inscrição</p>
    <label className="flex gap-3 text-sm leading-6"><input type="checkbox" name="confirmed" required />Confirmei a autorização e a ciência dos responsáveis destes alunos conforme a política de proteção do ministério.</label>
    <button className="button-primary justify-self-start" disabled={pending || count === 0}>{pending ? "Inscrevendo…" : "Inscrever todos no Mundo 1"}</button>
    {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    {state?.success && <p role="status" className="text-sm text-emerald-800">{state.success}</p>}
  </form>;
}
