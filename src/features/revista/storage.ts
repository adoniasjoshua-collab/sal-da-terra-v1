"use client";

import { useSyncExternalStore } from "react";

// localStorage with an in-memory fallback: private windows or blocked storage
// still work for the current visit. Only team scores and screen positions are
// stored — never student data.
const EVENTO = "revista-storage";
const memoria = new Map<string, string | null>();

function assinar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENTO, callback); };
}

export function ler(chave: string): string | null {
  if (memoria.has(chave)) return memoria.get(chave) ?? null;
  try { return localStorage.getItem(chave); } catch { return null; }
}

export function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave); else localStorage.setItem(chave, valor);
    memoria.delete(chave);
  } catch { memoria.set(chave, valor); }
  window.dispatchEvent(new Event(EVENTO));
}

export function useArmazenado(chave: string): string | null {
  return useSyncExternalStore(assinar, () => ler(chave), () => null);
}
