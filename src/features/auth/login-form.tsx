"use client";

import { useActionState } from "react";
import { login } from "@/features/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return <form action={action} className="space-y-5">
    <div><label className="label" htmlFor="identifier">Usuário ou e-mail</label><input className="input" id="identifier" name="identifier" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} required /></div>
    <div><label className="label" htmlFor="password">Senha ou código de acesso</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>
    {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <button className="button-primary w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
  </form>;
}
