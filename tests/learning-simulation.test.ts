import { describe, expect, it } from "vitest";
import content from "../content/fundamentos/voce-faz-parte.v1.json";
import type { WorldContent } from "../src/services/learning";
import { simulateCommand, simulatePracticeApproval, startSimulation, type Simulation } from "../src/services/learning-simulation";

const world = content as unknown as WorldContent;
const run = (simulation: Simulation, command: Parameters<typeof simulateCommand>[2]) => simulateCommand(world, simulation, command);
const correctAnswers = Object.fromEntries(world.questions.map((q) => [q.id, q.correct!]));

describe("leadership student simulation", () => {
  it("follows the server rules through completion with unique XP", () => {
    let sim = startSimulation();
    expect(run(sim, { command: "exercise", target: "x", answer: 0 }).error).toBeDefined();
    for (const card of [...world.cards, world.cards[0]]) sim = run(sim, { command: "reading", target: "x", reading: card.id }).simulation;
    expect(sim.enrollment.xp).toBe(world.rules.xp.reading);
    const wrong = run(sim, { command: "exercise", target: "x", answer: (world.exercise.correct! + 1) % world.exercise.options.length });
    expect(wrong.result?.correct).toBe(false);
    sim = run(wrong.simulation, { command: "exercise", target: "x", answer: world.exercise.correct! }).simulation;
    const failed = run(sim, { command: "quiz", target: "x", answers: Object.fromEntries(world.questions.map((q) => [q.id, (q.correct! + 1) % q.options.length])), requestId: "a0000000-0000-4000-8000-000000000001" });
    expect(failed.result?.passed).toBe(false);
    sim = run(failed.simulation, { command: "quiz", target: "x", answers: correctAnswers, requestId: "a0000000-0000-4000-8000-000000000002" }).simulation;
    sim = run(sim, { command: "quiz", target: "x", answers: correctAnswers, requestId: "a0000000-0000-4000-8000-000000000003" }).simulation;
    sim = run(sim, { command: "summary", target: "x" }).simulation;
    sim = run(sim, { command: "request_practice", target: "x" }).simulation;
    expect(sim.enrollment.practice_state).toBe("pending");
    expect(sim.enrollment.completed_at).toBeNull();
    sim = simulatePracticeApproval(world, sim);
    expect(sim.enrollment.completed_at).not.toBeNull();
    expect(sim.enrollment.xp).toBe(220);
  });
  it("requires every quiz answer before grading", () => {
    let sim = startSimulation();
    for (const card of world.cards) sim = run(sim, { command: "reading", target: "x", reading: card.id }).simulation;
    sim = run(sim, { command: "exercise", target: "x", answer: world.exercise.correct! }).simulation;
    expect(run(sim, { command: "quiz", target: "x", answers: { q1: 0 }, requestId: "a0000000-0000-4000-8000-000000000004" }).error).toMatch(/Responda todas/);
  });
});
