"use client";
import { useActionState } from "react";
import { createStudent, updateStudent } from "./actions";

type StudentDefaults = { id?: string; full_name?: string; preferred_name?: string | null; birth_date?: string; gender?: string | null; phone?: string | null; guardian_name?: string; guardian_phone?: string; guardian_relationship?: string; joined_at?: string; notes?: string | null; status?: string };
export function StudentForm({ student = {} }: { student?: StudentDefaults }) {
  const action = student.id ? updateStudent.bind(null, student.id) : createStudent;
  const [state, formAction, pending] = useActionState(action, undefined);
  return <form action={formAction} className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
    <Field label="Nome completo" name="full_name" defaultValue={student.full_name} required />
    <Field label="Nome preferido" name="preferred_name" defaultValue={student.preferred_name} />
    <Field label="Data de nascimento" name="birth_date" type="date" defaultValue={student.birth_date} required />
    <Field label="Gênero (opcional)" name="gender" defaultValue={student.gender} />
    <Field label="Telefone (opcional)" name="phone" type="tel" defaultValue={student.phone} />
    <Field label="Data de entrada" name="joined_at" type="date" defaultValue={student.joined_at ?? new Date().toISOString().slice(0,10)} required />
    <Field label="Responsável" name="guardian_name" defaultValue={student.guardian_name} required />
    <Field label="Telefone do responsável" name="guardian_phone" type="tel" defaultValue={student.guardian_phone} required />
    <Field label="Relação com o adolescente" name="guardian_relationship" defaultValue={student.guardian_relationship} required />
    <div><label className="label" htmlFor="status">Status cadastral</label><select className="input" id="status" name="status" defaultValue={student.status ?? "active"}><option value="active">Ativo</option><option value="visitor">Visitante</option><option value="inactive">Inativo</option></select></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="notes">Observações gerais não sensíveis</label><textarea className="input min-h-28" id="notes" name="notes" defaultValue={student.notes ?? ""} maxLength={1000}/></div>
    {state?.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.error}</p>}
    {state?.success && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">{state.success}</p>}
    <div className="sm:col-span-2"><button className="button-primary w-full sm:w-auto" disabled={pending}>{pending ? "Salvando…" : student.id ? "Salvar alterações" : "Cadastrar adolescente"}</button></div>
  </form>;
}
function Field({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue?: string | null; required?: boolean }) { return <div><label className="label" htmlFor={name}>{label}</label><input className="input" id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required}/></div>; }
