"use client";

import { useState, useTransition, type ReactNode } from "react";
import { runLearningCommand } from "./actions";

export function CommandForm({ command, target, label, children, disabled = false }: {
  command: string; target?: string; label: string; children?: ReactNode; disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  return <form className="grid gap-3" onSubmit={(event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      try {
        const result = await runLearningCommand({ ...fields, command, target, confirmed: fields.confirmed === "on" });
        setFailed(Boolean(result.error));
        setMessage(result.error ?? "Alteração salva.");
      } catch { setFailed(true); setMessage("Não foi possível confirmar o salvamento. Atualize a página antes de tentar novamente."); }
    });
  }}>
    <fieldset disabled={pending || disabled} className="grid gap-3">{children}<button className="button-secondary justify-self-start" type="submit">{pending ? "Salvando…" : label}</button></fieldset>
    {message && <p role={failed ? "alert" : "status"} className={`text-sm ${failed ? "text-red-800" : "text-emerald-800"}`}>{message}</p>}
  </form>;
}
