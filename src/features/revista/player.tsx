"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ajustarPlacar, aplicarResgate, cenariosDasTelas, chavePlacar, chaveProgresso, lerPlacares, lerProgresso, numeroMissao, placarVazio, RESGATE, rotuloDaTela, times,
  type Licao, type Placar, type RespostaQuiz, type Time,
} from "@/services/revista";
import { TelaRevista } from "./screens";
import { gravar, ler, useArmazenado } from "./storage";

const PASSO_PLACAR = 10;

function alvoInterativo(alvo: EventTarget | null) {
  return alvo instanceof HTMLElement && Boolean(alvo.closest("input, textarea, select, [contenteditable='true']"));
}

type LicaoAnterior = { numero: number; titulo: string } | null;

export function RevistaPlayer({ licao, podeConduzir, anterior = null }: { licao: Licao; podeConduzir: boolean; anterior?: LicaoAnterior }) {
  const raiz = useRef<HTMLDivElement>(null);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const [professorAberto, setProfessorAberto] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);

  const chave = chaveProgresso(licao.numero);
  const progressoBruto = useArmazenado(chave);
  const placaresBruto = useArmazenado(chavePlacar);
  const progresso = useMemo(() => lerProgresso(progressoBruto), [progressoBruto]);
  const placares = useMemo(() => lerPlacares(placaresBruto), [placaresBruto]);
  const placar: Placar = placares[licao.numero] ?? placarVazio;

  const total = licao.telas.length;
  const indice = Math.min(progresso.tela, total - 1);
  const tela = licao.telas[indice];
  const cenarios = useMemo(() => cenariosDasTelas(licao.telas), [licao.telas]);

  // Always derive writes from the latest stored value so rapid clicks never lose updates.
  const salvarProgresso = useCallback((mudar: (p: ReturnType<typeof lerProgresso>) => ReturnType<typeof lerProgresso>) => {
    gravar(chave, JSON.stringify(mudar(lerProgresso(ler(chave)))));
  }, [chave]);
  const salvarPlacar = useCallback((mudar: (p: Placar) => Placar) => {
    const todos = lerPlacares(ler(chavePlacar));
    gravar(chavePlacar, JSON.stringify({ ...todos, [licao.numero]: mudar(todos[licao.numero] ?? placarVazio) }));
  }, [licao.numero]);

  const irPara = useCallback((destino: number) => {
    const alvo = Math.max(0, Math.min(total - 1, destino));
    salvarProgresso((p) => ({ ...p, tela: alvo }));
  }, [salvarProgresso, total]);
  const avancar = useCallback(() => irPara(indice + 1), [irPara, indice]);
  const voltar = useCallback(() => irPara(indice - 1), [irPara, indice]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || alvoInterativo(e.target)) return;
      if (e.key === "Escape" && professorAberto) { setProfessorAberto(false); return; }
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); avancar(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); voltar(); }
      else if (e.key === " " && !(e.target instanceof HTMLElement && e.target.closest("button, a"))) { e.preventDefault(); if (e.shiftKey) voltar(); else avancar(); }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [avancar, voltar, professorAberto]);

  useEffect(() => {
    const aoMudar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);

  async function alternarTelaCheia() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await raiz.current?.requestFullscreen();
    } catch { /* fullscreen not allowed (e.g. iOS Safari): the player is already full-viewport */ }
  }

  function responder(indicePergunta: number, resposta: RespostaQuiz) {
    let aplicada = false;
    salvarProgresso((p) => {
      const lista = [...(p.quiz[String(indice)] ?? [])];
      if (lista[indicePergunta]) return p; // already answered: never score twice
      aplicada = true;
      lista[indicePergunta] = resposta;
      for (let i = 0; i < lista.length; i += 1) lista[i] ??= null;
      return { ...p, quiz: { ...p.quiz, [String(indice)]: lista } };
    });
    if (aplicada && podeConduzir && resposta.pontos > 0) salvarPlacar((p) => ajustarPlacar(p, resposta.time, resposta.pontos));
  }

  function refazerQuiz() {
    const lista = progresso.quiz[String(indice)] ?? [];
    if (podeConduzir) salvarPlacar((p) => lista.reduce((acc, r) => (r?.correta ? ajustarPlacar(acc, r.time, -r.pontos) : acc), p));
    salvarProgresso((p) => { const quiz = { ...p.quiz }; delete quiz[String(indice)]; return { ...p, quiz }; });
  }

  function resgatar(time: Time, sentido: 1 | -1) {
    const todos = lerPlacares(ler(chavePlacar));
    const resultado = aplicarResgate(lerProgresso(ler(chave)), todos[licao.numero] ?? placarVazio, time, sentido);
    if (!resultado) return;
    gravar(chave, JSON.stringify(resultado.progresso));
    gravar(chavePlacar, JSON.stringify({ ...todos, [licao.numero]: resultado.placar }));
  }

  function zerarAula() {
    if (!window.confirm("Zerar o placar e o progresso desta aula neste aparelho?")) return;
    salvarPlacar(() => placarVazio);
    gravar(chave, null);
  }

  return <div ref={raiz} className={`rv-player rv-cenario-${cenarios[indice]}`}>
    <header className="rv-barra-topo">
      <Link href="/conhecimento/revista" className="rv-botao-topo" aria-label="Voltar à trilha">← <span className="hidden sm:inline">Trilha</span></Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black sm:text-base">Missão {numeroMissao(licao.numero)} · {licao.titulo}</p>
        <div className="rv-progresso mt-1" role="progressbar" aria-label="Progresso da aula" aria-valuemin={1} aria-valuemax={total} aria-valuenow={indice + 1} aria-valuetext={`Tela ${indice + 1} de ${total}`}>
          <span style={{ width: `${((indice + 1) / total) * 100}%` }} />
        </div>
      </div>
      {podeConduzir && <div className="flex items-center gap-1 sm:gap-2" aria-label="Placar da aula">
        {(["sal", "luz"] as Time[]).map((t) => <div key={t} className={`rv-placar rv-vez-${t}`}>
          <button type="button" className="rv-placar-botao" onClick={() => salvarPlacar((p) => ajustarPlacar(p, t, -PASSO_PLACAR))} aria-label={`Tirar ${PASSO_PLACAR} pontos do time ${times[t].nome}`}>−</button>
          <span className="min-w-[3.5ch] text-center font-black tabular-nums" aria-live="polite"><span aria-hidden="true">{times[t].emoji} </span><span className="sr-only">{times[t].nome}: </span>{placar[t]}</span>
          <button type="button" className="rv-placar-botao" onClick={() => salvarPlacar((p) => ajustarPlacar(p, t, PASSO_PLACAR))} aria-label={`Dar ${PASSO_PLACAR} pontos ao time ${times[t].nome}`}>+</button>
        </div>)}
      </div>}
      {podeConduzir && <button type="button" className="rv-botao-topo" aria-pressed={professorAberto} aria-controls="rv-professor" onClick={() => setProfessorAberto(!professorAberto)}>
        🎓 <span className="hidden md:inline">Modo Professor</span>
      </button>}
      <button type="button" className="rv-botao-topo" onClick={alternarTelaCheia} aria-pressed={telaCheia} aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"}>⛶</button>
    </header>

    <main className="rv-palco" aria-roledescription="apresentação" aria-label={`Tela ${indice + 1} de ${total}: ${rotuloDaTela(tela)}`}
      onTouchStart={(e) => { if (alvoInterativo(e.target)) { toque.current = null; return; } toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => {
        const inicio = toque.current; toque.current = null;
        if (!inicio) return;
        const dx = e.changedTouches[0].clientX - inicio.x, dy = e.changedTouches[0].clientY - inicio.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) avancar(); else voltar(); }
      }}>
      <div key={indice} className="rv-tela">
        <TelaRevista tela={tela} licao={licao} quiz={{
          semente: `licao-${licao.numero}:tela-${indice}`, podeConduzir,
          respostas: progresso.quiz[String(indice)] ?? [], aoResponder: responder, aoRefazer: refazerQuiz,
        }} />
      </div>
    </main>

    <nav className="rv-barra-base" aria-label="Navegação da aula">
      <button type="button" className="rv-botao rv-nav" onClick={voltar} disabled={indice === 0}>← Voltar</button>
      <p className="text-center text-sm font-bold opacity-90" aria-live="polite">{indice + 1} / {total}</p>
      <button type="button" className="rv-botao rv-botao-destaque rv-nav" onClick={avancar} disabled={indice === total - 1}>Avançar →</button>
    </nav>

    {podeConduzir && professorAberto && <aside id="rv-professor" className="rv-professor" aria-label="Modo Professor">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#9a6b00]">Modo Professor · tela {indice + 1}</p>
        <button type="button" className="rv-botao-link-escuro" onClick={() => setProfessorAberto(false)}>Fechar</button>
      </div>
      <h2 className="mt-2 text-lg font-black">{rotuloDaTela(tela)}</h2>
      <dl className="mt-3 grid gap-3 text-sm leading-6">
        <div><dt className="font-black">⏱️ Tempo sugerido</dt><dd>{tela.professor?.tempo ?? "—"}</dd></div>
        <div><dt className="font-black">🗣️ Fala do professor</dt><dd>{tela.professor?.fala ?? "—"}</dd></div>
        <div><dt className="font-black">🧠 Técnica</dt><dd>{tela.professor?.tecnica ?? "—"}</dd></div>
      </dl>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-black">Roteiro completo ({total} telas)</summary>
        <ol className="mt-2 grid gap-1">
          {licao.telas.map((t, i) => <li key={i}>
            <button type="button" className={`w-full rounded-lg px-2 py-1 text-left hover:bg-[#f5ecd2] ${i === indice ? "bg-[#f5ecd2] font-black" : ""}`} onClick={() => irPara(i)}>
              {i + 1}. {rotuloDaTela(t)}{t.professor?.tempo ? ` · ${t.professor.tempo}` : ""}
            </button>
          </li>)}
        </ol>
      </details>
      <PainelResgate anterior={anterior} resgate={progresso.resgate ?? placarVazio} aoResgatar={resgatar} />
      <button type="button" className="mt-4 text-sm font-bold text-[#a1291a] underline" onClick={zerarAula}>Zerar placar e progresso desta aula</button>
    </aside>}
  </div>;
}

function PainelResgate({ anterior, resgate, aoResgatar }: { anterior: LicaoAnterior; resgate: Placar; aoResgatar: (time: Time, sentido: 1 | -1) => void }) {
  return <section className="mt-4 rounded-xl border border-[#e6d3a3] bg-[#fdf3dc] p-3 text-sm" aria-labelledby="rv-resgate-titulo">
    <h3 id="rv-resgate-titulo" className="font-black">🛟 Resgate{anterior ? ` da Lição ${anterior.numero}` : ""}</h3>
    <p className="mt-1 leading-6">
      {anterior ? <>Quem faltou em “{anterior.titulo}” e estudou em casa responde 2 ou 3 perguntas suas, ao vivo. </> : <>Quem faltou na aula anterior e estudou em casa responde 2 ou 3 perguntas suas, ao vivo. </>}
      Se responder, o time em que está hoje ganha +{RESGATE.pontos}. Não diga à turma quem faltou.
    </p>
    <div className="mt-2 grid grid-cols-2 gap-2">
      {(["sal", "luz"] as Time[]).map((t) => {
        const cheio = resgate[t] >= RESGATE.limitePorTime;
        return <div key={t} className={`rounded-lg p-2 text-center rv-vez-${t}`}>
          <p className="font-black" aria-live="polite">{times[t].emoji} {times[t].nome}: {resgate[t]}/{RESGATE.limitePorTime}</p>
          <div className="mt-1 flex justify-center gap-1">
            <button type="button" className="rv-placar-botao" disabled={resgate[t] === 0} onClick={() => aoResgatar(t, -1)} aria-label={`Desfazer um resgate do time ${times[t].nome}`}>−</button>
            <button type="button" className="rv-placar-botao" disabled={cheio} onClick={() => aoResgatar(t, 1)} aria-label={`Resgate: dar ${RESGATE.pontos} pontos ao time ${times[t].nome}`}>+{RESGATE.pontos}</button>
          </div>
          {cheio && <p className="mt-1 text-xs">Limite desta aula</p>}
        </div>;
      })}
    </div>
  </section>;
}
