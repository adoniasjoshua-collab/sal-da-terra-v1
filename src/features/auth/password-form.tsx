"use client";

import { useActionState } from "react";
import { updatePassword } from "@/features/auth/actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

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
