"use client";

import { useActionState } from "react";
import { login } from "@/features/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return <form action={action} className="space-y-5">
    <div><label className="label" htmlFor="email">E-mail</label><input className="input" id="email" name="email" type="email" autoComplete="email" required /></div>
    <div><label className="label" htmlFor="password">Senha</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>
    {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <button className="button-primary w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
  </form>;
}
