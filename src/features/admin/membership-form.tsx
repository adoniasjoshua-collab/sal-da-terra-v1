"use client";

import { useActionState } from "react";
import { updateMembership } from "./actions";
import type { MemberRole } from "@/types/database";

type Props = {
  id: string;
  name: string;
  profileId: string;
  role: MemberRole;
  isActive: boolean;
  isCurrentUser: boolean;
};

const roleLabels: Record<MemberRole, string> = {
  student: "Adolescente",
  leader: "Líder",
  admin: "Administrador",
};

export function MembershipForm({ id, name, profileId, role, isActive, isCurrentUser }: Props) {
  const [state, formAction, pending] = useActionState(updateMembership, undefined);

  function confirmSensitiveChange(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const nextRole = (form.elements.namedItem("role") as HTMLSelectElement).value;
    const nextActive = (form.elements.namedItem("is_active") as HTMLSelectElement).value === "true";
    const removesAccess = !nextActive || (isCurrentUser && nextRole !== "admin");
    if (removesAccess && !window.confirm("Confirma esta alteração de acesso? O usuário poderá perder acesso imediatamente.")) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={confirmSensitiveChange} className="card grid items-end gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
      <input type="hidden" name="id" value={id} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-bold">{name}</p>
          {isCurrentUser && <span className="badge bg-emerald-50 text-emerald-800">Você</span>}
          <span className={`badge ${isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
            {isActive ? "Ativo" : "Inativo"}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-[#647268]" title={profileId}>{profileId}</p>
      </div>
      <div>
        <label className="label" htmlFor={`role-${id}`}>Função</label>
        <select className="input" id={`role-${id}`} name="role" defaultValue={role}>
          {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`active-${id}`}>Acesso</label>
        <select className="input" id={`active-${id}`} name="is_active" defaultValue={String(isActive)}>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>
      <button className="button-secondary" disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar"}
      </button>
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-4">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-4">{state.success}</p>}
    </form>
  );
}
