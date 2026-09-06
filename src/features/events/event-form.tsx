"use client";

import { useActionState, useState } from "react";
import { createEvent } from "./actions";
import { defaultAttendanceMode, EVENT_TYPE_OPTIONS, type AttendanceMode, type EventType } from "@/services/events";

export function EventForm() {
  const [state, action, pending] = useActionState(createEvent, undefined);
  const [type, setType] = useState<EventType>("EBD");
  const [mode, setMode] = useState<AttendanceMode>("full_roster");

  return (
    <form action={action} className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
      <div>
        <label className="label" htmlFor="type">Tipo de evento</label>
        <select
          className="input"
          id="type"
          name="type"
          value={type}
          onChange={(event) => {
            const nextType = event.target.value as EventType;
            setType(nextType);
            setMode(defaultAttendanceMode(nextType));
          }}
        >
          {EVENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="attendance_mode">Registro de participação</label>
        <select className="input" id="attendance_mode" name="attendance_mode" value={mode} onChange={(event) => setMode(event.target.value as AttendanceMode)}>
          <option value="full_roster">Chamada completa</option>
          <option value="participation_only">Somente participação</option>
        </select>
        <p className="mt-2 text-xs text-[#647268]">Chamada completa registra faltas; participação opcional não gera ausência.</p>
      </div>
      <div>
        <label className="label" htmlFor="title">Título</label>
        <input className="input" id="title" name="title" defaultValue="EBD" required />
      </div>
      <div>
        <label className="label" htmlFor="event_date">Data</label>
        <input className="input" id="event_date" name="event_date" type="date" required />
      </div>
      <div>
        <label className="label" htmlFor="start_time">Horário</label>
        <input className="input" id="start_time" name="start_time" type="time" defaultValue="09:00" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="description">Descrição (opcional)</label>
        <textarea className="input min-h-24" id="description" name="description" maxLength={1000} />
      </div>
      {state?.error && <p role="alert" className="text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <button className="button-primary" disabled={pending}>{pending ? "Criando…" : "Criar evento"}</button>
      </div>
    </form>
  );
}
