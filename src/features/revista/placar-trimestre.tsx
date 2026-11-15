"use client";

import { chavePlacar, lerPlacares, somarPlacares, times } from "@/services/revista";
import { useArmazenado } from "./storage";

export function PlacarTrimestre() {
  const total = somarPlacares(Object.values(lerPlacares(useArmazenado(chavePlacar))));
  return <section className="rv-placar-trimestre" aria-labelledby="placar-trimestre">
    <h2 id="placar-trimestre" className="text-xs font-black uppercase tracking-[.16em] text-[#f5d77a]">Placar do trimestre</h2>
    <div className="mt-3 grid grid-cols-2 gap-3">
      {(["sal", "luz"] as const).map((t) => <div key={t} className={`rounded-2xl p-4 text-center rv-vez-${t}`}>
        <p className="text-sm font-black">{times[t].emoji} {times[t].nome}</p>
        <p className="text-4xl font-black tabular-nums">{total[t]}</p>
      </div>)}
    </div>
    <p className="mt-3 text-xs text-white/80">Vós sois o sal da terra… Vós sois a luz do mundo (Mt 5.13-14). Pontos só por time, salvos neste aparelho.</p>
  </section>;
}
