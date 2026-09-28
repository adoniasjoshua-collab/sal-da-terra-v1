"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { learningProgress, practiceLabels, type Enrollment, type LearningCommand, type LearningResult, type WorldContent } from "@/services/learning";
import { runLearningCommand } from "./actions";

const stepStyles = {
  done: "border-[#176b49] bg-[#edf7f1] text-[#143d2c]",
  active: "border-[#e6c861] bg-[#fff8dd] text-[#19382b]",
  locked: "border-[#dfe6df] bg-white text-[#526158]",
};

const cardGuides: Record<string, { scene: string; idea: string; checkpoint: string; visual: "known" | "welcome" | "body" | "limits" }> = {
  conhecido: {
    scene: "Você chega, olha em volta e pensa: será que alguém percebeu que eu estou aqui?",
    idea: "Deus não olha para você como número de chamada. Ele conhece, cuida e chama pelo nome.",
    checkpoint: "Marque esta etapa quando entender: ser conhecido por Deus não exige expor sua intimidade ao grupo.",
    visual: "known",
  },
  acolhido: {
    scene: "Uma pessoa nova entra calada. O grupo pode abrir espaço sem colocar um holofote nela.",
    idea: "Jesus acolheu quando tentaram afastar. Acolher é aproximar com respeito, não forçar alguém a falar.",
    checkpoint: "Marque esta etapa quando conseguir diferenciar convite gentil de exposição pública.",
    visual: "welcome",
  },
  "muitos-membros": {
    scene: "No grupo tem gente que fala muito, gente que observa, gente que ajuda em silêncio e gente que está aprendendo.",
    idea: "Paulo usa a imagem do corpo para mostrar diversidade, cuidado e cooperação.",
    checkpoint: "Marque esta etapa quando lembrar: contribuir não é aparecer mais que os outros.",
    visual: "body",
  },
  respeito: {
    scene: "Pertencer não significa aceitar apelido ofensivo, pressão ou brincadeira que machuca.",
    idea: "Acolhimento cristão tem amor, verdade e limite. Respeito também é cuidado.",
    checkpoint: "Marque esta etapa quando entender que pedir ajuda a um adulto responsável pode proteger alguém.",
    visual: "limits",
  },
};

function StageIllustration({ type, title }: { type: "known" | "welcome" | "body" | "limits"; title: string }) {
  const palette = {
    known: ["#143d2c", "#e6c861", "#edf7f1"],
    welcome: ["#416b86", "#e6c861", "#eef6fb"],
    body: ["#176b49", "#805d72", "#edf7f1"],
    limits: ["#ad791e", "#143d2c", "#fff8dd"],
  }[type];
  return <svg className="h-44 w-full rounded-2xl bg-[#f5f7f3]" viewBox="0 0 420 220" role="img" aria-labelledby={`${type}-title`}>
    <title id={`${type}-title`}>{title}</title>
    <rect width="420" height="220" rx="24" fill={palette[2]} />
    <circle cx="350" cy="42" r="28" fill={palette[1]} opacity=".55" />
    <path d="M70 165 C120 112 168 112 210 165 C252 112 300 112 350 165" fill="none" stroke={palette[0]} strokeWidth="12" strokeLinecap="round" />
    {type === "known" && <g><circle cx="210" cy="88" r="30" fill={palette[0]} /><path d="M162 150 Q210 116 258 150" fill="none" stroke={palette[1]} strokeWidth="12" strokeLinecap="round" /><path d="M150 54 Q210 20 270 54" fill="none" stroke={palette[0]} strokeWidth="8" strokeLinecap="round" opacity=".35" /></g>}
    {type === "welcome" && <g><circle cx="150" cy="86" r="24" fill={palette[0]} /><circle cx="245" cy="86" r="24" fill={palette[1]} /><path d="M171 113 L224 113" stroke={palette[0]} strokeWidth="10" strokeLinecap="round" /><path d="M285 78 L315 78 M300 63 L300 93" stroke={palette[0]} strokeWidth="8" strokeLinecap="round" /></g>}
    {type === "body" && <g>{[120, 180, 240, 300].map((x, index) => <g key={x}><circle cx={x} cy={82 + (index % 2) * 12} r="21" fill={index % 2 ? palette[1] : palette[0]} /><path d={`M ${x - 28} 150 Q ${x} 118 ${x + 28} 150`} fill="none" stroke={index % 2 ? palette[1] : palette[0]} strokeWidth="10" strokeLinecap="round" /></g>)}</g>}
    {type === "limits" && <g><circle cx="172" cy="86" r="24" fill={palette[0]} /><circle cx="255" cy="86" r="24" fill={palette[1]} /><path d="M212 58 V154" stroke={palette[0]} strokeWidth="8" strokeLinecap="round" strokeDasharray="4 14" /><path d="M132 154 H292" stroke={palette[1]} strokeWidth="10" strokeLinecap="round" /></g>}
  </svg>;
}

// "storage" only fires in other tabs; this event keeps the current tab in sync.
const DRAFT_EVENT = "sal-learning-draft";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(DRAFT_EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(DRAFT_EVENT, callback); };
};
function readDraft(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeDraft(key: string, value: string | null) {
  if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  window.dispatchEvent(new Event(DRAFT_EVENT));
}
function storedAnswers(raw: string | null): unknown {
  try { return JSON.parse(raw ?? "null")?.answers ?? null; } catch { return null; }
}

export function WorldPlayer({ content, enrollment, userId, readOnly = false }: { content: WorldContent; enrollment: Enrollment; userId: string; readOnly?: boolean }) {
  const [busy, startTransition] = useTransition();
  const pending = busy || readOnly;
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<LearningResult | null>(enrollment.last_quiz ?? null);
  const [exerciseAnswer, setExerciseAnswer] = useState<number | null>(null);
  const [exerciseFeedback, setExerciseFeedback] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>(enrollment.quiz_draft);
  const key = `sal-learning:${userId}:${enrollment.id}:v${content.version}`;
  const stored = useSyncExternalStore(subscribe, () => readDraft(key), () => null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revision = useRef(0);
  const request = useRef<{ signature: string; id: string } | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const progress = learningProgress(enrollment, content);
  const readingsDone = content.cards.every((card) => enrollment.readings.includes(card.id));
  const nextReadingIndex = content.cards.findIndex((card) => !enrollment.readings.includes(card.id));
  const missionSteps = [
    ...content.cards.map((card, index) => ({ label: `Leitura ${index + 1}`, done: enrollment.readings.includes(card.id), active: nextReadingIndex === index })),
    { label: "Escolha", done: enrollment.exercise_done, active: readingsDone && !enrollment.exercise_done },
    { label: "Quiz", done: enrollment.quiz_passed, active: enrollment.exercise_done && !enrollment.quiz_passed },
    { label: "Revisão", done: enrollment.summary_done, active: enrollment.quiz_passed && !enrollment.summary_done },
    { label: "Prática", done: enrollment.practice_state === "approved", active: enrollment.summary_done && enrollment.practice_state !== "approved" },
  ];
  // Offer restoration only when this browser holds answers different from the ones on screen.
  const localAnswers = storedAnswers(stored);
  const canRestore = !readOnly && enrollment.exercise_done && localAnswers !== null && JSON.stringify(localAnswers) !== JSON.stringify(answers);

  function send(command: LearningCommand, after?: (value: LearningResult) => void) {
    startTransition(async () => {
      try {
        const response = await runLearningCommand(command);
        setFailed(Boolean(response.error));
        setMessage(response.error ?? "Etapa salva com segurança.");
        if (response.result) after?.(response.result);
      } catch {
        setFailed(true);
        setMessage("Não foi possível confirmar o salvamento. Verifique sua conexão e tente novamente; o progresso já confirmado está preservado.");
      }
    });
  }

  function saveDraft(next: Record<string, number>) {
    setAnswers(next);
    const current = ++revision.current;
    try { writeDraft(key, JSON.stringify({ answers: next, expires: Date.now() + 7 * 86400000 })); }
    catch { setMessage("Este navegador não permite guardar rascunhos locais. Use Salvar rascunho enquanto estiver conectado."); }
    if (timer.current) clearTimeout(timer.current);
    setMessage("Rascunho alterado; aguardando confirmação do servidor.");
    timer.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const response = await runLearningCommand({ command: "save_draft", target: enrollment.id, answers: next });
          if (revision.current === current) {
            setFailed(Boolean(response.error));
            setMessage(response.error ?? "Rascunho salvo no servidor.");
          }
        } catch {
          if (revision.current === current) { setFailed(true); setMessage("Sem confirmação do servidor. Suas escolhas permanecem nesta tela; tente salvar novamente."); }
        }
      });
    }, 800);
  }

  function restoreDraft() {
    try {
      const saved = JSON.parse(stored ?? "null");
      if (!saved || saved.expires < Date.now() || !saved.answers || typeof saved.answers !== "object") throw new Error();
      const safe: Record<string, number> = {};
      for (const question of content.questions) {
        const value = saved.answers[question.id];
        if (Number.isInteger(value) && value >= 0 && value < question.options.length) safe[question.id] = value;
      }
      saveDraft(safe);
    } catch { setMessage("O rascunho local expirou ou não é válido. O progresso confirmado no servidor permanece disponível."); }
  }

  return <div className="grid gap-6">
    <nav className="flex flex-wrap gap-3" aria-label="Sua jornada"><Link className="button-secondary" href="/trilhas/fundamentos">Voltar ao mapa</Link><Link className="button-secondary" href="/meu-progresso">Meu progresso</Link></nav>
    <section className="overflow-hidden rounded-2xl border border-[#d9e5dd] bg-white shadow-sm" aria-label="Progresso do mundo">
      <div className="bg-[#143d2c] p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[.16em] text-[#e6c861]">Missão ativa</p>
            <h2 className="mt-2 text-2xl font-black">Acolher sem expor</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d7eadf]">Complete as etapas, receba feedback e peça a validação da prática quando terminar.</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 text-right">
            <p className="text-3xl font-black">{enrollment.xp}<span className="text-base text-[#e6c861]"> XP</span></p>
            <p className="text-sm text-[#d7eadf]">{progress.done} de {progress.total} etapas</p>
          </div>
        </div>
        <div className="mt-5 h-3 rounded-full bg-white/20">
          <div className="h-3 rounded-full bg-[#e6c861]" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
      <ol className="grid gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {missionSteps.map((step, index) => <li className={`rounded-xl border p-3 text-sm font-bold ${step.done ? stepStyles.done : step.active ? stepStyles.active : stepStyles.locked}`} key={`${step.label}-${index}`}>
          <span className="mr-2">{step.done ? "✓" : index + 1}</span>{step.label}
        </li>)}
      </ol>
      <p className="px-5 pb-5 text-sm text-[#526158]">Seu percurso é privado. Pontos representam atividades educacionais, nunca sua fé.</p>
    </section>
    <div className="sticky top-0 z-10 rounded-xl border border-[#dfe6df] bg-white p-3 text-sm shadow-sm" role={failed ? "alert" : "status"} aria-live="polite">{readOnly ? "Esta versão foi arquivada. Você pode revisar o conteúdo, mas novas atividades não são registradas." : busy ? "Salvando…" : message || "Avance no seu ritmo. Marque cada leitura depois de realizá-la."}</div>
    <section className="rounded-2xl border border-[#dfe6df] bg-[#fffdf5] p-5 sm:p-7"><p className="text-sm font-black uppercase tracking-[.14em] text-[#ad791e]">Cena de abertura</p><p className="mt-2 text-2xl font-black">{content.hook}</p><p className="mt-3 leading-7">{content.objective}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-[#526158]">Tempo</p><p className="mt-1 font-black">{content.estimatedMinutes}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-[#526158]">Conquista</p><p className="mt-1 font-black">{content.achievement}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-[#526158]">Meta</p><p className="mt-1 font-black">Acolher com respeito</p></div></div><p className="mt-4 text-sm">{content.sourceNote}</p></section>
    {content.cards.map((card) => {
      const guide = cardGuides[card.id] ?? { scene: card.paragraphs[0], idea: content.centralIdea, checkpoint: "Marque esta etapa quando concluir a leitura com atenção.", visual: "known" as const };
      return <section key={card.id} className="card overflow-hidden" aria-labelledby={card.id}>
      <div className="grid gap-5 p-5 sm:grid-cols-[.9fr_1.1fr] sm:p-7">
        <StageIllustration type={guide.visual} title={content.media.alt} />
        <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.14em] text-[#176b49]">Microetapa</p><h2 id={card.id} className="mt-1 text-xl font-black">{card.title}</h2><p className="mt-2 text-sm font-semibold text-[#176b49]">{card.reference}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${enrollment.readings.includes(card.id) ? "bg-[#edf7f1] text-[#176b49]" : "bg-[#f5f7f3] text-[#526158]"}`}>{enrollment.readings.includes(card.id) ? "Concluída" : "+20 XP"}</span>
      </div>
      <div className="mt-5 rounded-xl bg-[#fff8dd] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#ad791e]">Na vida real</p><p className="mt-2 font-bold leading-7">{guide.scene}</p></div>
      <div className="mt-4 rounded-xl bg-[#edf7f1] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#176b49]">Ideia-chave</p><p className="mt-2 leading-7">{guide.idea}</p></div>
        </div>
      </div>
      <div className="border-t border-[#e7ece8] p-5 sm:p-7">
      <details className="group rounded-xl border border-[#dfe6df] bg-white p-4" open={nextReadingIndex === -1 || content.cards[nextReadingIndex]?.id === card.id}>
        <summary className="cursor-pointer font-black">Ler explicação completa</summary>
        <div className="mt-3 grid gap-4">
          {card.paragraphs.map((paragraph, index) => <p key={index} className="max-w-3xl leading-8">{paragraph}</p>)}
        </div>
      </details>
      <p className="mt-4 rounded-xl bg-[#f5f7f3] p-4 text-sm font-semibold text-[#405048]">{guide.checkpoint}</p>
      <button className="button-primary mt-5" disabled={pending || enrollment.readings.includes(card.id)} onClick={() => send({ command: "reading", target: enrollment.id, reading: card.id })}>{enrollment.readings.includes(card.id) ? "Leitura concluída" : "Concluí esta leitura"}</button>
      </div>
    </section>;
    })}
    <section className="card p-5 sm:p-7" aria-labelledby="exercise-title"><p className="text-xs font-black uppercase tracking-[.14em] text-[#176b49]">Desafio de cenário · +30 XP</p><h2 id="exercise-title" className="mt-1 text-xl font-black">Uma escolha de acolhimento</h2><p className="mt-3">{content.exercise.prompt}</p>
      {!readingsDone && <p className="mt-3 text-sm">Marque as quatro leituras para realizar esta atividade.</p>}
      <fieldset disabled={pending || !readingsDone} className="mt-4 grid gap-2"><legend className="sr-only">Escolha uma atitude</legend>{content.exercise.options.map((option, index) => <label key={option} className="flex min-h-11 items-start gap-3 rounded-xl border border-[#dfe6df] p-3"><input className="mt-1" type="radio" name="exercise" checked={exerciseAnswer === index} onChange={() => setExerciseAnswer(index)} />{option}</label>)}</fieldset>
      <button className="button-primary mt-4" disabled={pending || !readingsDone || exerciseAnswer === null} onClick={() => send({ command: "exercise", target: enrollment.id, answer: exerciseAnswer! }, (value) => setExerciseFeedback(`${value.correct ? "Boa escolha." : "Vamos pensar novamente."} ${value.explanation}`))}>Conferir minha escolha</button>
      {exerciseFeedback && <p role="status" className="mt-3 leading-7">{exerciseFeedback}</p>}{enrollment.exercise_done && <p className="mt-3 text-sm font-bold text-emerald-800">Exercício concluído.</p>}
    </section>
    <section className="card p-5 sm:p-7" aria-labelledby="quiz-title"><p className="text-xs font-black uppercase tracking-[.14em] text-[#176b49]">Quiz com feedback · +40 XP</p><h2 id="quiz-title" className="mt-1 text-xl font-black">Vamos conferir o que aprendemos?</h2><p className="mt-2 text-sm">A meta é {content.rules.passingPercent}% de acertos. Você pode revisar e tentar novamente sem perder o progresso.</p>
      {!enrollment.exercise_done && <p className="mt-3 text-sm">Conclua o exercício de acolhimento para começar.</p>}
      {canRestore && <button className="button-secondary mt-4" disabled={pending} onClick={restoreDraft}>Retomar rascunho deste navegador</button>}
      <form className="mt-5 grid gap-6" onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        const signature = JSON.stringify(answers);
        if (!request.current || request.current.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
        send({ command: "quiz", target: enrollment.id, answers, requestId: request.current.id }, (value) => {
          setResult(value);
          try { writeDraft(key, null); } catch { /* Local storage is optional. */ }
          request.current = null;
        });
      }}>
        {content.questions.map((question, index) => <fieldset key={question.id} disabled={pending || !enrollment.exercise_done} className="grid gap-2"><legend className="mb-3 font-bold">{index + 1}. {question.prompt}</legend>{question.options.map((option, value) => <label key={option} className="flex min-h-11 items-start gap-3 rounded-xl border border-[#dfe6df] p-3"><input className="mt-1" required type="radio" name={question.id} checked={answers[question.id] === value} onChange={() => saveDraft({ ...answers, [question.id]: value })} />{option}</label>)}</fieldset>)}
        <div className="flex flex-wrap gap-3"><button type="button" className="button-secondary" disabled={pending || !enrollment.exercise_done} onClick={() => { if (timer.current) clearTimeout(timer.current); send({ command: "save_draft", target: enrollment.id, answers }); }}>Salvar rascunho</button><button className="button-primary" disabled={pending || !enrollment.exercise_done} type="submit">Conferir respostas</button></div>
      </form>
      {result?.feedback && <div className="mt-5 rounded-xl bg-[#edf7f1] p-4" role="status"><h3 className="font-bold">{result.passed ? "Etapa concluída!" : "Você pode revisar e tentar de novo."} {result.correctCount}/{result.total} acertos.</h3><ol className="mt-3 grid gap-3">{result.feedback.map((item, index) => <li key={item.id}><strong>{index + 1}. {item.correct ? "Isso mesmo." : "Vamos revisar."}</strong> {item.explanation}</li>)}</ol></div>}
    </section>
    <section className="card p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[.14em] text-[#176b49]">Revisão do mundo · +50 XP</p><h2 className="mt-1 text-xl font-black">Leve esta ideia com você</h2><p className="mt-3 leading-7">{content.closing}</p><button className="button-primary mt-4" disabled={pending || !enrollment.quiz_passed || enrollment.summary_done} onClick={() => send({ command: "summary", target: enrollment.id })}>{enrollment.summary_done ? "Resumo concluído" : "Concluí a revisão deste mundo"}</button></section>
    <section className="card p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[.14em] text-[#176b49]">Prática supervisionada · +80 XP</p><h2 className="mt-1 text-xl font-black">Um gesto de acolhimento</h2><p className="mt-3 leading-7">{content.practice}</p><p className="mt-3 font-bold">{practiceLabels[enrollment.practice_state]}</p><button className="button-primary mt-4" disabled={pending || !enrollment.summary_done || ["pending", "approved"].includes(enrollment.practice_state)} onClick={() => send({ command: "request_practice", target: enrollment.id })}>Pedir validação à liderança</button></section>
    {enrollment.completed_at && <section className="rounded-2xl bg-[#143d2c] p-7 text-white" role="status"><p className="text-sm font-bold text-[#e6c861]">CONQUISTA DESBLOQUEADA</p><h2 className="mt-2 text-2xl font-black">{content.achievement}</h2><p className="mt-3">Você concluiu este mundo. Pode voltar para revisar quando quiser.</p><Link className="button-secondary mt-5" href="/trilhas/fundamentos">Ver próximos mundos</Link></section>}
  </div>;
}
