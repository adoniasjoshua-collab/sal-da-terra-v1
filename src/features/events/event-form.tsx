"use client";

import { useActionState, useState } from "react";
import { createEvent, updateEvent } from "./actions";
import { defaultAttendanceMode, EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS, type AttendanceMode, type EventType } from "@/services/events";

type EventDefaults = {
  id: string;
  title: string;
  type: EventType;
  attendance_mode: AttendanceMode;
  event_date: string;
  start_time: string | null;
  description: string | null;
};

function suggestedTitle(type: EventType) {
  return type === "EBD" ? "EBD" : EVENT_TYPE_LABELS[type];
}

export function EventForm({ event, participationLocked = false, defaultDate }: { event?: EventDefaults; participationLocked?: boolean; defaultDate?: string }) {
  const action = event ? updateEvent.bind(null, event.id) : createEvent;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<EventType>(event?.type ?? "EBD");
  const [mode, setMode] = useState<AttendanceMode>(event?.attendance_mode ?? "full_roster");
  const [title, setTitle] = useState(event?.title ?? "EBD");
  const modeLocked = participationLocked || type === "EBD";

  return (
    <form action={formAction} className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
      <div>
        <label className="label" htmlFor="type">Tipo de evento</label>
        {participationLocked && <input type="hidden" name="type" value={type} />}
        <select className="input disabled:bg-[#f5f7f3] disabled:text-[#526158]" id="type" name="type" value={type} disabled={participationLocked} onChange={(change) => {
          const nextType = change.target.value as EventType;
          setTitle((current) => current === suggestedTitle(type) ? suggestedTitle(nextType) : current);
          setType(nextType);
          setMode(defaultAttendanceMode(nextType));
        }}>
          {EVENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {participationLocked && <p className="mt-2 text-xs text-[#647268]">O tipo fica protegido depois que há participação registrada.</p>}
      </div>
      <div>
        <label className="label" htmlFor="attendance_mode">Registro de participação</label>
        {modeLocked ? (
          <>
            <input type="hidden" name="attendance_mode" value={mode} />
            <input className="input bg-[#f5f7f3] text-[#526158]" id="attendance_mode" value={type === "EBD" ? "Chamada completa" : mode === "headcount_only" ? "Somente quantidade" : mode === "participation_only" ? "Participantes identificados" : "Chamada completa"} readOnly aria-describedby="attendance-mode-help" />
          </>
        ) : (
          <select className="input" id="attendance_mode" name="attendance_mode" value={mode} onChange={(change) => setMode(change.target.value as AttendanceMode)}>
            <option value="headcount_only">Somente quantidade — sem nomes</option>
            <option value="participation_only">Participantes identificados — sem faltas</option>
            <option value="full_roster">Chamada completa — com faltas</option>
          </select>
        )}
        <p id="attendance-mode-help" className="mt-2 text-xs text-[#647268]">
          {mode === "headcount_only" ? "Mais privacidade: registra apenas o total e os visitantes." : mode === "participation_only" ? "Registra quem participou, sem gerar ausência." : "Registra presença, ausência e justificativa por nome."}
        </p>
      </div>
      <div><label className="label" htmlFor="title">Título</label><input className="input" id="title" name="title" value={title} onChange={(change) => setTitle(change.target.value)} required /></div>
      <div><label className="label" htmlFor="event_date">Data</label><input className="input" id="event_date" name="event_date" type="date" defaultValue={event?.event_date ?? defaultDate} required /></div>
      <div><label className="label" htmlFor="start_time">Horário</label><input className="input" id="start_time" name="start_time" type="time" defaultValue={event?.start_time?.slice(0, 5) ?? "09:00"} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="description">Descrição (opcional)</label><textarea className="input min-h-24" id="description" name="description" maxLength={1000} defaultValue={event?.description ?? ""} /></div>
      {state?.error && <p role="alert" className="text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2"><button className="button-primary" disabled={pending}>{pending ? "Salvando…" : event ? "Salvar alterações" : "Criar evento"}</button></div>
    </form>
  );
}
