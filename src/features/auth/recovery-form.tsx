"use client";

import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RecoveryForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const supabase = createClient();
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    setPending(false);
    if (recoveryError) {
      setError("Não foi possível enviar agora. Aguarde um minuto e tente novamente.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-xl border border-[#cfe3d7] bg-[#f0f8f3] p-4 text-sm leading-6 text-[#176b49]">
        <p className="font-black">E-mail enviado.</p>
        <p className="mt-1">Abra somente a mensagem mais recente neste mesmo aparelho e navegador. Verifique também Spam e Promoções.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label" htmlFor="recovery-email">E-mail da conta</label>
        <input className="input" id="recovery-email" name="email" type="email" autoComplete="email" required />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="button-primary w-full" disabled={pending}>{pending ? "Enviando…" : "Enviar link seguro"}</button>
    </form>
  );
}
