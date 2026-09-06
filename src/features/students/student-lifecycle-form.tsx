"use client";

import { useActionState } from "react";
import { archiveStudent, reactivateStudent } from "./actions";

export function StudentLifecycleForm({ id, archived }: { id: string; archived: boolean }) {
  const action = archived ? reactivateStudent : archiveStudent;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="id" value={id} />
      {state?.error && <p role="alert" className="mb-3 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p role="status" className="mb-3 text-sm text-emerald-700">{state.success}</p>}
      <button className={archived ? "button-primary" : "button-danger"} disabled={pending}>
        {pending ? "Processando…" : archived ? "Reativar adolescente" : "Arquivar cadastro"}
      </button>
    </form>
  );
}
