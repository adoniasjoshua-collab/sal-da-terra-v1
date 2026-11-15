"use client";

import { useState, type ReactNode } from "react";
import {
  formatarDataLonga, numeroMissao, ordemEmbaralhada, responderPergunta, resultadoQuiz, timeDaVez, times, vencedorDoDia,
  type Licao, type Placar, type RespostaQuiz, type Tela, type Time,
} from "@/services/revista";
import { Confete, Cronometro, Sorteio } from "./efeitos";
import { tocar } from "./sons";

type TelaDe<T extends Tela["tipo"]> = Extract<Tela, { tipo: T }>;

export function Pergaminho({ versiculos, leitor, rotulo }: { versiculos: { referencia: string; texto: string }[]; leitor?: number; rotulo?: string }) {
  return <figure className="rv-pergaminho">
    <div className="rv-pergaminho-topo">
      {leitor ? <span className="rv-leitor">Leitor {leitor}</span> : rotulo ? <span className="rv-leitor">{rotulo}</span> : <span />}
      <span className="rv-selo" aria-label="Almeida Revista e Corrigida">ARC</span>
    </div>
    {versiculos.map((v, i) => <blockquote key={v.referencia + i} className="rv-versiculo">
      <p className={i === 0 ? "rv-capitular" : undefined}>{v.texto}</p>
      <cite className="rv-ref">{v.referencia}</cite>
    </blockquote>)}
  </figure>;
}

function Titulo({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return <header className="mb-[clamp(1rem,3vh,2.5rem)] text-center">
    {eyebrow && <p className="rv-eyebrow">{eyebrow}</p>}
    <h2 className="rv-titulo">{children}</h2>
  </header>;
}

function Revelar({ rotulo = "Revelar", children }: { rotulo?: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return aberto
    ? <div className="rv-surgir" role="status">{children}</div>
    : <button type="button" className="rv-botao rv-botao-destaque" onClick={() => { tocar("revelar"); setAberto(true); }}>{rotulo}</button>;
}

function Capa({ licao }: { licao: Licao }) {
  return <div className="mx-auto grid max-w-5xl gap-[clamp(1rem,3vh,2rem)] text-center">
    <p className="rv-eyebrow">Missão {numeroMissao(licao.numero)} · {formatarDataLonga(licao.data)}</p>
    <h2 className="rv-titulo-capa rv-surgir">{licao.titulo}</h2>
    {licao.textoBiblico && <p className="rv-texto">📜 Texto bíblico: <strong>{licao.textoBiblico}</strong></p>}
    {licao.textoAureo && <Pergaminho versiculos={[licao.textoAureo]} rotulo="Texto áureo" />}
    {licao.objetivo && <p className="rv-texto-menor opacity-90">🎯 {licao.objetivo}</p>}
  </div>;
}

function Gancho({ tela }: { tela: TelaDe<"gancho"> }) {
  return <div className="mx-auto grid max-w-5xl place-items-center gap-[clamp(1.5rem,5vh,3rem)] text-center">
    <p className="rv-eyebrow">🪝 Gancho</p>
    <h2 className="rv-titulo-capa">“{tela.pergunta}”</h2>
    <Revelar><p className="rv-texto rv-cartao">{tela.revelacao}</p></Revelar>
  </div>;
}

function Memoria({ tela }: { tela: TelaDe<"memoria"> }) {
  const [passo, setPasso] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [respostas, setRespostas] = useState<Set<number>>(new Set());
  const desafio = passo >= tela.objetos.length;
  if (!desafio) {
    const objeto = tela.objetos[passo];
    return <div className="mx-auto grid max-w-4xl place-items-center gap-[clamp(1rem,3vh,2rem)] text-center">
      <Titulo eyebrow={`Objeto ${passo + 1} de ${tela.objetos.length}`}>{tela.titulo}</Titulo>
      <div key={passo} className="rv-cartao rv-surgir grid min-w-[min(100%,28rem)] place-items-center gap-3">
        <span className="rv-emoji" aria-hidden="true">{objeto.emoji}</span>
        <p className="rv-texto font-black">{objeto.nome}</p>
        {revelado && <p className="rv-texto rv-surgir text-[#f5d77a]" role="status">{objeto.resposta}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {!revelado && <button type="button" className="rv-botao rv-botao-destaque" onClick={() => { tocar("revelar"); setRevelado(true); }}>Quem usa isso?</button>}
        {revelado && <button type="button" className="rv-botao" onClick={() => { setPasso(passo + 1); setRevelado(false); }}>
          {passo + 1 < tela.objetos.length ? "Próximo objeto →" : "Desafio de memória 🧠"}
        </button>}
      </div>
    </div>;
  }
  return <div className="mx-auto grid max-w-4xl gap-[clamp(1rem,3vh,2rem)]">
    <Titulo eyebrow="🧠 Desafio de memória">Você lembra a ordem?</Titulo>
    <ol className="grid gap-3">
      {tela.perguntas.map((p, i) => <li key={p.pergunta} className="rv-cartao flex flex-wrap items-center justify-between gap-3">
        <span className="rv-texto">{p.pergunta}</span>
        {respostas.has(i)
          ? <strong className="rv-texto rv-surgir text-[#f5d77a]">{p.resposta}</strong>
          : <button type="button" className="rv-botao" onClick={() => { tocar("revelar"); setRespostas(new Set(respostas).add(i)); }}>Revelar</button>}
      </li>)}
    </ol>
    {tela.fechamento && respostas.size === tela.perguntas.length && <p className="rv-destaque rv-surgir">{tela.fechamento}</p>}
    <button type="button" className="rv-botao-link justify-self-center" onClick={() => { setPasso(0); setRespostas(new Set()); }}>↺ Recomeçar o jogo</button>
  </div>;
}

function TelaPergaminho({ tela }: { tela: TelaDe<"pergaminho"> }) {
  return <div className="mx-auto grid max-w-5xl gap-[clamp(1rem,3vh,2rem)]">
    {tela.titulo && <Titulo>{tela.titulo}</Titulo>}
    {tela.leituras.map((l, i) => <Pergaminho key={i} versiculos={l.versiculos} leitor={l.leitor} />)}
    {tela.selo && <p className="rv-selo-laco rv-surgir">{tela.selo}</p>}
    {tela.reflexao && <p className="rv-destaque rv-surgir">🔭 {tela.reflexao}</p>}
  </div>;
}

function Fase({ tela }: { tela: TelaDe<"fase"> }) {
  return <div className="mx-auto grid max-w-6xl gap-[clamp(1rem,3vh,2rem)]">
    <Titulo eyebrow={tela.numero ? `Fase ${tela.numero}` : undefined}>{tela.titulo}</Titulo>
    {tela.gancho && <p className="rv-cartao rv-texto text-center">🗳️ {tela.gancho}</p>}
    {tela.versiculo && <Pergaminho versiculos={[tela.versiculo]} />}
    {tela.barras && <ul className="grid gap-3 sm:grid-cols-2" aria-label="Barras de crescimento">
      {tela.barras.map((b, i) => <li key={b.rotulo} className="rv-cartao">
        <p className="rv-texto-menor flex justify-between gap-2"><strong>{b.rotulo}</strong><span className="opacity-85">{b.descricao}</span></p>
        <div className="rv-barra mt-2" aria-hidden="true"><span className="rv-barra-xp" style={{ animationDelay: `${i * 220}ms` }} /></div>
      </li>)}
    </ul>}
    {tela.blocos.length > 0 && <div className="grid gap-3 md:grid-cols-2">
      {tela.blocos.map((b) => <article key={b.titulo} className="rv-cartao">
        <h3 className="rv-subtitulo">{b.titulo}</h3>
        <p className="rv-texto-menor mt-2">{b.texto}</p>
      </article>)}
    </div>}
    {tela.destaque && <p className="rv-destaque">✨ {tela.destaque}</p>}
    {tela.humor && <p className="rv-texto-menor text-center opacity-90">😅 {tela.humor}</p>}
  </div>;
}

function Comparacao({ tela }: { tela: TelaDe<"comparacao"> }) {
  return <div className="mx-auto grid max-w-6xl gap-[clamp(1rem,3vh,2rem)]">
    {tela.titulo && <Titulo>{tela.titulo}</Titulo>}
    <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
      <article className="rv-cartao rv-surgir"><h3 className="rv-subtitulo">{tela.esquerda.rotulo}</h3><p className="rv-texto mt-3">{tela.esquerda.texto}</p></article>
      <span className="rv-versus" aria-hidden="true">VS</span>
      <article className="rv-cartao rv-surgir"><h3 className="rv-subtitulo">{tela.direita.rotulo}</h3><p className="rv-texto mt-3">{tela.direita.texto}</p></article>
    </div>
  </div>;
}

function RaioX({ tela }: { tela: TelaDe<"raio-x"> }) {
  // Example only: values live in component state and are never stored or sent.
  const [valores, setValores] = useState(() => tela.areas.map(() => 5));
  return <div className="mx-auto grid max-w-5xl gap-[clamp(1rem,3vh,2rem)]">
    <Titulo eyebrow="🩻 Autoavaliação">{tela.titulo}</Titulo>
    <ul className="grid gap-4">
      {tela.areas.map((a, i) => <li key={a.rotulo} className="rv-cartao">
        <label className="rv-texto-menor flex flex-wrap justify-between gap-2" htmlFor={`raio-${i}`}>
          <span><strong>{a.rotulo}</strong> · {a.descricao}</span><strong aria-hidden="true">{valores[i]}/10</strong>
        </label>
        <input id={`raio-${i}`} className="rv-slider mt-3" type="range" min={0} max={10} step={1} value={valores[i]}
          onChange={(e) => setValores(valores.map((v, j) => (j === i ? Number(e.target.value) : v)))} />
        <div className="rv-barra mt-2" aria-hidden="true"><span className="rv-barra-valor" style={{ width: `${valores[i] * 10}%` }} /></div>
      </li>)}
    </ul>
    <p className="rv-texto-menor text-center opacity-90">📝 Faça no papel: circule a área mais fraca e escreva uma atitude para melhorar. Nada desta tela é salvo.</p>
  </div>;
}

function PowerUps({ tela }: { tela: TelaDe<"power-ups"> }) {
  const [ativos, setAtivos] = useState<Set<number>>(new Set());
  return <div className="mx-auto grid max-w-6xl gap-[clamp(1rem,3vh,2rem)]">
    <Titulo eyebrow="⚡ Power-ups">{tela.titulo}</Titulo>
    <div className="grid gap-3 sm:grid-cols-2">
      {tela.itens.map((item, i) => {
        const ativo = ativos.has(i);
        return <button key={item.titulo} type="button" aria-pressed={ativo} className={`rv-cartao rv-powerup text-left ${ativo ? "rv-powerup-ativo" : ""}`}
          onClick={() => { if (!ativo) tocar("revelar"); setAtivos(new Set(ativos).add(i)); }}>
          <span className="rv-subtitulo">{ativo ? "⚡" : "🔒"} {item.titulo}</span>
          {ativo ? <span className="rv-texto-menor rv-surgir mt-2 block">{item.texto}{item.referencia && <em className="mt-1 block opacity-90">{item.referencia}</em>}</span>
            : <span className="rv-texto-menor mt-2 block opacity-80">Toque para desbloquear</span>}
        </button>;
      })}
    </div>
    {tela.espelho && <div className="justify-self-center text-center"><Revelar rotulo="🪞 Pergunta-espelho"><p className="rv-destaque">🪞 {tela.espelho}</p></Revelar></div>}
  </div>;
}

function Arena({ tela, podeConduzir }: { tela: TelaDe<"arena">; podeConduzir: boolean }) {
  const [vistas, setVistas] = useState(0);
  return <div className="mx-auto grid max-w-5xl gap-[clamp(1rem,3vh,2rem)]">
    <Titulo eyebrow="🏟️ Arena">{tela.titulo}</Titulo>
    <ol className="grid gap-3">
      {tela.perguntas.slice(0, vistas).map((p, i) => <li key={p} className={`rv-cartao rv-surgir rv-texto ${i === vistas - 1 ? "rv-cartao-atual" : "opacity-75"}`}>
        <span className="mr-2 font-black text-[#f5d77a]">{i + 1}.</span>{p}
      </li>)}
    </ol>
    {vistas < tela.perguntas.length
      ? <button type="button" className="rv-botao rv-botao-destaque justify-self-center" onClick={() => { tocar("revelar"); setVistas(vistas + 1); }}>
        {vistas === 0 ? "Revelar 1ª pergunta" : `Próxima pergunta (${vistas + 1}/${tela.perguntas.length})`}
      </button>
      : <p className="rv-texto-menor text-center opacity-90">Todas as perguntas foram reveladas.</p>}
    {podeConduzir && vistas > 0 && <Cronometro key={vistas} />}
  </div>;
}

export type QuizProps = {
  tela: TelaDe<"quiz">; semente: string; podeConduzir: boolean;
  respostas: (RespostaQuiz | null)[]; aoResponder: (indice: number, resposta: RespostaQuiz) => void; aoRefazer: () => void;
  /** Team drawn to start this quiz; undefined until a draw happens (Sal starts by default). */
  inicio?: Time; aoSortear: (time: Time) => void;
};

function Quiz({ tela, semente, podeConduzir, respostas, aoResponder, aoRefazer, inicio, aoSortear }: QuizProps) {
  const [feedbackDe, setFeedbackDe] = useState<number | null>(null);
  const respondidas = respostas.filter(Boolean).length;
  const indice = feedbackDe ?? respondidas;
  const total = tela.perguntas.length;

  if (indice >= total) {
    const r = resultadoQuiz(respostas);
    const vencedor = r.sal.pontos === r.luz.pontos ? null : r.sal.pontos > r.luz.pontos ? "sal" : "luz";
    return <div className="mx-auto grid max-w-4xl gap-[clamp(1rem,3vh,2rem)] text-center">
      {podeConduzir && vencedor && <Confete />}
      <Titulo eyebrow="🏁 Resultado">{tela.titulo}</Titulo>
      {podeConduzir ? <>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["sal", "luz"] as const).map((t) => <div key={t} className={`rv-cartao rv-surgir ${vencedor === t ? "rv-cartao-atual" : ""}`}>
            <p className="rv-subtitulo">{times[t].emoji} {times[t].nome}</p>
            <p className="rv-numero">+{r[t].pontos}</p>
            <p className="rv-texto-menor">{r[t].acertos} {r[t].acertos === 1 ? "acerto" : "acertos"}</p>
          </div>)}
        </div>
        <p className="rv-destaque">{vencedor ? `${times[vencedor].emoji} Time ${times[vencedor].nome} venceu o desafio!` : "Empate! Os dois times brilharam."}</p>
      </> : <p className="rv-destaque">Você acertou {r.sal.acertos + r.luz.acertos} de {total}. 🎉</p>}
      <button type="button" className="rv-botao-link justify-self-center" onClick={() => { setFeedbackDe(null); aoRefazer(); }}>
        ↺ Refazer o quiz{podeConduzir ? " (remove os pontos ganhos nele)" : ""}
      </button>
    </div>;
  }

  const pergunta = tela.perguntas[indice];
  const resposta = respostas[indice] ?? null;
  const ordem = ordemEmbaralhada(pergunta.opcoes.length, `${semente}:${indice}`);
  const vez = timeDaVez(indice, inicio);
  return <div className="mx-auto grid max-w-5xl gap-[clamp(1rem,3vh,2rem)]">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <p className="rv-eyebrow">{tela.titulo} · {indice + 1}/{total}{pergunta.bonus ? ` · Bônus +${pergunta.pontos}` : ""}</p>
      {podeConduzir && <div className="flex flex-wrap items-center gap-2">
        {indice === 0 && !resposta && !inicio && <Sorteio aoSortear={aoSortear} />}
        <p key={vez} className={`rv-vez rv-vez-${vez} rv-surgir`}>Vez do time {times[vez].emoji} {times[vez].nome}</p>
      </div>}
    </header>
    <h2 className="rv-titulo">{pergunta.enunciado}</h2>
    <div className="grid gap-3 md:grid-cols-2">
      {ordem.map((opcao, pos) => {
        const estado = !resposta ? "" : opcao === 0 ? "rv-opcao-certa" : opcao === resposta.escolha ? "rv-opcao-errada" : "opacity-60";
        return <button key={opcao} type="button" disabled={Boolean(resposta)} className={`rv-opcao ${estado}`}
          onClick={() => {
            const r = responderPergunta(pergunta, indice, opcao, inicio);
            tocar(r.correta ? "acerto" : "erro");
            aoResponder(indice, r); setFeedbackDe(indice);
          }}>
          <span className="rv-opcao-letra" aria-hidden="true">{"ABCDEF"[pos]}</span>
          <span>{pergunta.opcoes[opcao]}</span>
          {resposta && opcao === 0 && <span className="ml-auto" aria-label="alternativa correta">✓</span>}
          {resposta && opcao !== 0 && opcao === resposta.escolha && <span className="ml-auto" aria-label="alternativa escolhida, incorreta">✗</span>}
        </button>;
      })}
    </div>
    {podeConduzir && !resposta && <Cronometro key={indice} />}
    {resposta?.correta && <Confete key={`confete-${indice}`} />}
    {resposta && <div className="grid justify-items-center gap-3 text-center" role="status">
      <p className="rv-destaque rv-surgir">
        {resposta.correta
          ? (podeConduzir ? `Acertou! +${resposta.pontos} para o time ${times[resposta.time].emoji} ${times[resposta.time].nome}` : "Acertou! 🎉")
          : `Não foi dessa vez. A resposta certa é: ${pergunta.opcoes[0]}`}
      </p>
      <button type="button" className="rv-botao rv-botao-destaque" onClick={() => { if (indice + 1 >= total) tocar("vitoria"); setFeedbackDe(null); }}>
        {indice + 1 < total ? "Próxima pergunta →" : "Ver resultado 🏁"}
      </button>
    </div>}
  </div>;
}

function Missao({ tela }: { tela: TelaDe<"missao"> }) {
  return <div className="mx-auto grid max-w-4xl gap-[clamp(1rem,3vh,2rem)]">
    <Titulo eyebrow="🎯 Missão da semana">{tela.titulo}</Titulo>
    <ul className="grid gap-3">
      {tela.tarefas.map((t, i) => <li key={t} className="rv-cartao">
        <label className="rv-texto flex cursor-pointer items-start gap-4" htmlFor={`missao-${i}`}>
          <input id={`missao-${i}`} type="checkbox" className="rv-check" /><span>{t}</span>
        </label>
      </li>)}
    </ul>
    <p className="rv-destaque">🎁 {tela.recompensa}</p>
  </div>;
}

export type PlacarFinal = { podeConduzir: boolean; aula: Placar; trimestre: Placar };

function TimeDoDia({ aula, trimestre }: { aula: Placar; trimestre: Placar }) {
  const [aberto, setAberto] = useState(false);
  if (!aberto) return <button type="button" className="rv-botao rv-botao-destaque justify-self-center" onClick={() => { tocar("vitoria"); setAberto(true); }}>🏆 Revelar o time do dia</button>;
  const vencedor = vencedorDoDia(aula);
  return <section className="rv-cartao rv-cartao-atual rv-surgir grid gap-3" role="status" aria-label="Time do dia">
    <Confete />
    <p className="rv-titulo">{vencedor ? `${times[vencedor].emoji} Time ${times[vencedor].nome} venceu a missão!` : "🧂💡 Empate! Os dois times venceram."}</p>
    <div className="grid grid-cols-2 gap-3">
      {(["sal", "luz"] as const).map((t) => <div key={t} className={`rounded-2xl p-3 rv-vez-${t}`}>
        <p className="font-black">{times[t].emoji} {times[t].nome}</p>
        <p className="rv-numero leading-none">{aula[t]}</p>
        <p className="text-sm font-bold">Trimestre: {trimestre[t]}</p>
      </div>)}
    </div>
  </section>;
}

function Encerramento({ tela, licao, final }: { tela: TelaDe<"encerramento">; licao: Licao; final: PlacarFinal }) {
  return <div className="mx-auto grid max-w-5xl gap-[clamp(1rem,3vh,2rem)] text-center">
    <p className="rv-eyebrow">Verdade aplicada</p>
    {licao.verdadeAplicada && <h2 className="rv-titulo-capa">{licao.verdadeAplicada}</h2>}
    <p className="rv-cartao rv-texto">🙏 {tela.oracao}</p>
    {final.podeConduzir && <TimeDoDia aula={final.aula} trimestre={final.trimestre} />}
    <p className="rv-teaser">🔒 {tela.teaser}</p>
  </div>;
}

export function TelaRevista({ tela, licao, quiz, final }: { tela: Tela; licao: Licao; quiz: Omit<QuizProps, "tela">; final: PlacarFinal }) {
  switch (tela.tipo) {
    case "capa": return <Capa licao={licao} />;
    case "gancho": return <Gancho tela={tela} />;
    case "memoria": return <Memoria tela={tela} />;
    case "pergaminho": return <TelaPergaminho tela={tela} />;
    case "fase": return <Fase tela={tela} />;
    case "comparacao": return <Comparacao tela={tela} />;
    case "raio-x": return <RaioX tela={tela} />;
    case "power-ups": return <PowerUps tela={tela} />;
    case "arena": return <Arena tela={tela} podeConduzir={quiz.podeConduzir} />;
    case "quiz": return <Quiz tela={tela} {...quiz} />;
    case "missao": return <Missao tela={tela} />;
    case "encerramento": return <Encerramento tela={tela} licao={licao} final={final} />;
  }
}
