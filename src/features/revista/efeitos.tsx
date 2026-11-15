"use client";

import { useEffect, useState } from "react";
import { CRONOMETRO_OPCOES, lerCronometro, times, type Time } from "@/services/revista";
import { CHAVE_SOM, tocar } from "./sons";
import { gravar, useArmazenado } from "./storage";

export function BotaoSom() {
  const ligado = useArmazenado(CHAVE_SOM) !== "desligado";
  return <button type="button" className="rv-botao-topo" aria-pressed={ligado} aria-label={ligado ? "Desligar sons" : "Ligar sons"}
    onClick={() => { gravar(CHAVE_SOM, ligado ? "desligado" : null); if (!ligado) setTimeout(() => tocar("ponto"), 0); }}>
    {ligado ? "🔊" : "🔇"}
  </button>;
}

const CORES = ["#f5d77a", "#ffffff", "#9ee6dc", "#ffb4a2", "#c7c2ff", "#fde68a"];

/** A short CSS confetti burst. Positions are fixed by index so renders stay pure. */
export function Confete() {
  return <div className="rv-confete" aria-hidden="true">
    {Array.from({ length: 28 }, (_, i) => <span key={i} style={{
      left: `${(i * 37) % 100}%`, background: CORES[i % CORES.length],
      animationDelay: `${(i % 7) * 70}ms`, animationDuration: `${1100 + (i % 5) * 160}ms`,
      transform: `rotate(${(i * 47) % 360}deg)`,
    }} />)}
  </div>;
}

export const CHAVE_CRONOMETRO = "revista:cronometro";

/** Optional countdown for the teacher; the chosen length is remembered on this device. */
export function Cronometro() {
  const duracao = lerCronometro(useArmazenado(CHAVE_CRONOMETRO));
  // Deadline-based: the shown seconds come from the clock, so a slow tab never drifts.
  const [fimEm, setFimEm] = useState<number | null>(null);
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    if (fimEm === null) return;
    let anterior = Number.POSITIVE_INFINITY;
    const id = setInterval(() => {
      const atual = Math.max(0, Math.ceil((fimEm - Date.now()) / 1000));
      if (atual !== anterior) {
        if (atual > 0 && atual <= 5) tocar("tique");
        if (atual === 0) tocar("tempo");
        anterior = atual;
        setRestante(atual);
      }
      if (atual === 0) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [fimEm]);

  if (duracao === 0) return <EscolherTempo atual={0} />;
  if (fimEm === null) return <div className="flex flex-wrap items-center justify-center gap-2">
    <button type="button" className="rv-botao" onClick={() => { setRestante(duracao); setFimEm(Date.now() + duracao * 1000); }}>⏱️ Iniciar {duracao} s</button>
    <EscolherTempo atual={duracao} />
  </div>;
  return <div className="flex items-center justify-center gap-3" role="timer" aria-live={restante <= 5 ? "assertive" : "off"}>
    <span className={`rv-cronometro ${restante <= 5 ? "rv-cronometro-fim" : ""}`}>{restante > 0 ? `${restante}s` : "Tempo! ⏰"}</span>
    <button type="button" className="rv-botao-link" onClick={() => setFimEm(null)}>{restante > 0 ? "Parar" : "Zerar"}</button>
  </div>;
}

function EscolherTempo({ atual }: { atual: number }) {
  return <label className="rv-texto-menor flex items-center gap-2 opacity-90">
    <span className="sr-only">Duração do cronômetro</span>
    <select className="rv-select" value={atual} onChange={(e) => gravar(CHAVE_CRONOMETRO, e.target.value)}>
      {CRONOMETRO_OPCOES.map((s) => <option key={s} value={s}>{s === 0 ? "⏱️ Sem cronômetro" : `${s} segundos`}</option>)}
    </select>
  </label>;
}

/** Spins Sal/Luz a few times and lands on a random team. */
export function Sorteio({ aoSortear }: { aoSortear: (time: Time) => void }) {
  const [girando, setGirando] = useState<Time | null>(null);
  function sortear() {
    const final: Time = crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0 ? "sal" : "luz";
    const voltas = final === "sal" ? 10 : 9; // even ends on Sal, odd on Luz
    let i = 0;
    const passo = () => {
      const atual: Time = i % 2 === 0 ? "sal" : "luz";
      setGirando(atual);
      tocar("sorteio");
      if (i < voltas) { i += 1; setTimeout(passo, 70 + i * 22); }
      else { tocar("vitoria"); setTimeout(() => { setGirando(null); aoSortear(final); }, 900); }
    };
    passo();
  }
  if (girando) return <p className={`rv-vez rv-vez-${girando} rv-sorteio`} role="status">{times[girando].emoji} {times[girando].nome}</p>;
  return <button type="button" className="rv-botao" onClick={sortear}>🎲 Sortear quem começa</button>;
}
