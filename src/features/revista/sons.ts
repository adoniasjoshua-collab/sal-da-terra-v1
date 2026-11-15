"use client";

import { ler } from "./storage";

// Game sounds synthesized with the Web Audio API: no audio files, no licensing,
// nothing downloaded. Volume is deliberately low (other classes may be nearby)
// and the teacher can mute it; the choice is remembered on this device.

export const CHAVE_SOM = "revista:som";
export const somLigado = () => ler(CHAVE_SOM) !== "desligado";

export type Efeito = "acerto" | "erro" | "revelar" | "ponto" | "tique" | "tempo" | "vitoria" | "sorteio";

type Nota = { freq: number; ate?: number; inicio: number; duracao: number; onda?: OscillatorType; volume?: number };

const VOLUME = 0.12;
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;

const efeitos: Record<Efeito, Nota[]> = {
  acerto: [{ freq: C5, inicio: 0, duracao: 0.1 }, { freq: E5, inicio: 0.08, duracao: 0.1 }, { freq: G5, inicio: 0.16, duracao: 0.22 }],
  // Soft and low on purpose: a miss should never sound like a punishment.
  erro: [{ freq: 330, ate: 247, inicio: 0, duracao: 0.35, onda: "sine", volume: 0.7 }],
  revelar: [{ freq: 440, ate: 880, inicio: 0, duracao: 0.18, onda: "sine" }],
  ponto: [{ freq: 880, inicio: 0, duracao: 0.07, onda: "square", volume: 0.4 }, { freq: 1320, inicio: 0.06, duracao: 0.09, onda: "square", volume: 0.4 }],
  tique: [{ freq: 1200, inicio: 0, duracao: 0.04, onda: "square", volume: 0.35 }],
  tempo: [{ freq: 392, inicio: 0, duracao: 0.18 }, { freq: 330, inicio: 0.2, duracao: 0.35 }],
  vitoria: [
    { freq: C5, inicio: 0, duracao: 0.14 }, { freq: E5, inicio: 0.14, duracao: 0.14 }, { freq: G5, inicio: 0.28, duracao: 0.14 },
    { freq: C6, inicio: 0.42, duracao: 0.5 }, { freq: G5, inicio: 0.42, duracao: 0.5, volume: 0.5 },
  ],
  sorteio: [{ freq: 700, inicio: 0, duracao: 0.03, onda: "square", volume: 0.3 }],
};

let contexto: AudioContext | null = null;

function obterContexto() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  contexto ??= new AudioContext();
  // Browsers start audio suspended until a user gesture; every sound here follows a click.
  if (contexto.state === "suspended") void contexto.resume().catch(() => undefined);
  return contexto;
}

export function tocar(efeito: Efeito) {
  if (!somLigado()) return;
  try {
    const ctx = obterContexto();
    if (!ctx) return;
    const agora = ctx.currentTime;
    for (const nota of efeitos[efeito]) {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      const t0 = agora + nota.inicio, t1 = t0 + nota.duracao;
      osc.type = nota.onda ?? "triangle";
      osc.frequency.setValueAtTime(nota.freq, t0);
      if (nota.ate) osc.frequency.exponentialRampToValueAtTime(nota.ate, t1);
      const pico = VOLUME * (nota.volume ?? 1);
      ganho.gain.setValueAtTime(0.0001, t0);
      ganho.gain.exponentialRampToValueAtTime(pico, t0 + 0.015);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t1);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    }
  } catch { /* audio is a nicety: never break the class over it */ }
}
