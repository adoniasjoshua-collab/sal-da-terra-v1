"use client";

import { useActionState, useState } from "react";
import { registerCompletedHeadcountEvent } from "./actions";
import { EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS, type EventType } from "@/services/events";

const aggregateTypes = EVENT_TYPE_OPTIONS.filter((option) => option.value !== "EBD");

export function QuickEventForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(registerCompletedHeadcountEvent, undefined);
  const [type, setType] = useState<EventType>("worship");
  const [title, setTitle] = useState(EVENT_TYPE_LABELS.worship);
  const [total, setTotal] = useState(0);

  return (
    <form action={action} className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
      <input type="hidden" name="attendance_mode" value="headcount_only" />
      <div className="rounded-xl border border-[#d7e6dc] bg-[#edf7f1] p-4 text-sm leading-6 text-[#365747] sm:col-span-2">Use este formulário para um evento que já aconteceu. Ele registra apenas quantidades, sem nomes, e conclui tudo em uma única etapa.</div>
      <div>
        <label className="label" htmlFor="quick-type">Tipo de evento</label>
        <select className="input" id="quick-type" name="type" value={type} onChange={(change) => {
          const nextType = change.target.value as EventType;
          setTitle((current) => current === EVENT_TYPE_LABELS[type] ? EVENT_TYPE_LABELS[nextType] : current);
          setType(nextType);
        }}>
          {aggregateTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <div><label className="label" htmlFor="quick-title">Título</label><input className="input" id="quick-title" name="title" value={title} onChange={(change) => setTitle(change.target.value)} required /></div>
      <div><label className="label" htmlFor="quick-date">Data</label><input className="input" id="quick-date" name="event_date" type="date" defaultValue={today} required /></div>
      <div><label className="label" htmlFor="quick-time">Horário (opcional)</label><input className="input" id="quick-time" name="start_time" type="time" /></div>
      <div>
        <label className="label" htmlFor="quick-total">Total de adolescentes presentes</label>
        <input className="input" id="quick-total" name="adolescent_count" type="number" inputMode="numeric" min="0" max="100000" value={total} onChange={(change) => setTotal(Number(change.target.value))} required />
        <p className="mt-2 text-xs text-[#647268]">Inclua os visitantes neste total.</p>
      </div>
      <div><label className="label" htmlFor="quick-visitors">Visitantes dentro do total</label><input className="input" id="quick-visitors" name="visitor_count" type="number" inputMode="numeric" min="0" max={Math.max(total, 0)} defaultValue="0" required /></div>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#dfe6df] p-3 text-sm sm:col-span-2"><input className="size-5" type="checkbox" name="is_estimated" /> A contagem é uma estimativa</label>
      <div className="sm:col-span-2"><label className="label" htmlFor="quick-description">Descrição do evento (opcional)</label><textarea className="input min-h-20" id="quick-description" name="description" maxLength={1000} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="quick-notes">Observação sobre a contagem (opcional)</label><textarea className="input min-h-20" id="quick-notes" name="notes" maxLength={500} placeholder="Ex.: contagem realizada na entrada; não inserir nomes." /></div>
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2"><button className="button-primary w-full sm:w-auto" disabled={pending}>{pending ? "Registrando…" : "Registrar evento realizado"}</button></div>
    </form>
  );
}
