"use client";

import { useRef, useState } from "react";
import type { LearningCommand, WorldContent } from "@/services/learning";
import { simulateCommand, simulatePracticeApproval, startSimulation, type Simulation } from "@/services/learning-simulation";
import { WorldPlayer } from "./world-player";

// Leadership preview of the exact learner player; every step stays in this tab.
export function StudentSimulation({ content, userId }: { content: WorldContent; userId: string }) {
  const [simulation, setSimulation] = useState(startSimulation);
  const [round, setRound] = useState(0);
  // Commands may run back to back before a re-render; keep the newest state here.
  const latest = useRef<Simulation | null>(null);
  function apply(next: Simulation) {
    latest.current = next;
    setSimulation(next);
  }

  async function runCommand(command: LearningCommand) {
    const step = simulateCommand(content, latest.current ?? simulation, command);
    apply(step.simulation);
    return step.error ? { error: step.error } : { result: step.result ?? {} };
  }

  return <div className="grid gap-5">
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      <p className="font-bold">Simulação do aluno — nada é salvo</p>
      <p className="mt-1">Esta é a mesma tela que o aluno inscrito verá, com as mesmas regras de etapas, quiz e XP. O progresso existe só nesta aba e não conta para nenhum aluno.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {simulation.enrollment.practice_state === "pending" && <button type="button" className="button-primary" onClick={() => apply(simulatePracticeApproval(content, latest.current ?? simulation))}>Simular validação da liderança</button>}
        <button type="button" className="button-secondary" onClick={() => { apply(startSimulation()); setRound((value) => value + 1); }}>Recomeçar simulação</button>
      </div>
    </div>
    <WorldPlayer key={round} content={content} enrollment={simulation.enrollment} userId={`simulacao-${userId}`} runCommand={runCommand} />
  </div>;
}
