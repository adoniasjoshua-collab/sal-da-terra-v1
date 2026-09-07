"use client";

import { useActionState, useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { updatePassword } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/client";

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "missing">("checking");

  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session) setSessionState("ready");
    });
    void supabase.auth.getSession().then((result: { data: { session: Session | null } }) => setSessionState(result.data.session ? "ready" : "missing"));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (sessionState === "checking") return <p role="status" className="rounded-xl bg-[#f0f8f3] p-4 text-sm text-[#176b49]">Validando seu convite…</p>;
  if (sessionState === "missing") return <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Este convite é inválido ou expirou. Solicite um novo convite à administração.</p>;

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="label" htmlFor="password">Nova senha</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
        <p className="mt-2 text-xs leading-5 text-[#647268]">Use pelo menos 12 caracteres, com letras maiúsculas, minúsculas e número.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirmation">Confirmar nova senha</label>
        <input className="input" id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </div>
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button className="button-primary w-full" disabled={pending}>{pending ? "Salvando…" : "Definir senha e entrar"}</button>
    </form>
  );
}
