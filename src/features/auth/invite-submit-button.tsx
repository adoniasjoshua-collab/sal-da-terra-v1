"use client";

import { useFormStatus } from "react-dom";

// The one-time token must be submitted once; a double tap would consume it twice.
export function InviteSubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button-primary w-full" disabled={pending}>{pending ? "Confirmando…" : "Continuar"}</button>;
}
