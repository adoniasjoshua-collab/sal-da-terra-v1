import { learningError, type Enrollment, type LearningCommand, type LearningResult, type QuizResult, type WorldContent } from "./learning";

// Staff-only, in-memory rehearsal of the learner journey. It mirrors the rules
// enforced by public.learning_command so leaders see the real experience, but
// nothing is persisted and it never grants real progress or XP.
type Event = keyof WorldContent["rules"]["xp"];
export type Simulation = { enrollment: Enrollment; earned: Event[] };
export type SimulationStep = { simulation: Simulation; error?: string; result?: LearningResult };

export function startSimulation(): Simulation {
  return {
    earned: [],
    enrollment: {
      id: "simulacao", is_active: true, readings: [], exercise_done: false, quiz_passed: false, summary_done: false,
      quiz_draft: {}, practice_state: "not_requested", practice_mode: null, completed_at: null, xp: 0, last_quiz: null,
    },
  };
}

function finish(content: WorldContent, enrollment: Enrollment, earned: Event[], event?: Event): Simulation {
  const events = event && !earned.includes(event) ? [...earned, event] : earned;
  const xp = events.reduce((sum, item) => sum + content.rules.xp[item], 0);
  const complete = enrollment.exercise_done && enrollment.quiz_passed && enrollment.summary_done && enrollment.practice_state === "approved";
  return { earned: events, enrollment: { ...enrollment, xp, completed_at: enrollment.completed_at ?? (complete ? new Date().toISOString() : null) } };
}

const fail = (simulation: Simulation, code: string): SimulationStep => ({ simulation, error: learningError(code) });

export function simulateCommand(content: WorldContent, simulation: Simulation, command: LearningCommand): SimulationStep {
  const current = simulation.enrollment;
  const readingsDone = content.cards.every((card) => current.readings.includes(card.id));
  const validOption = (value: unknown, options: string[]) => Number.isInteger(value) && (value as number) >= 0 && (value as number) < options.length;

  switch (command.command) {
    case "reading": {
      if (!content.cards.some((card) => card.id === command.reading)) return fail(simulation, "learning_invalid_input");
      const readings = current.readings.includes(command.reading) ? current.readings : [...current.readings, command.reading];
      const next = { ...current, readings };
      const all = content.cards.every((card) => readings.includes(card.id));
      return { simulation: finish(content, next, simulation.earned, all ? "reading" : undefined) };
    }
    case "exercise": {
      if (!readingsDone) return fail(simulation, "learning_prerequisite");
      if (!validOption(command.answer, content.exercise.options)) return fail(simulation, "learning_invalid_input");
      const correct = command.answer === content.exercise.correct;
      const next = correct ? { ...current, exercise_done: true } : current;
      return { simulation: finish(content, next, simulation.earned, correct ? "exercise" : undefined), result: { correct, explanation: content.exercise.explanation } };
    }
    case "save_draft":
    case "quiz": {
      if (!readingsDone || !current.exercise_done) return fail(simulation, "learning_prerequisite");
      const answers = command.answers;
      for (const [id, value] of Object.entries(answers)) {
        const question = content.questions.find((item) => item.id === id);
        if (!question || !validOption(value, question.options)) return fail(simulation, "learning_invalid_input");
      }
      if (command.command === "save_draft") return { simulation: { ...simulation, enrollment: { ...current, quiz_draft: answers } } };
      if (content.questions.some((question) => answers[question.id] === undefined)) return fail(simulation, "learning_incomplete_quiz");
      const feedback = content.questions.map((question) => ({ id: question.id, correct: answers[question.id] === question.correct, explanation: question.explanation ?? "" }));
      const correctCount = feedback.filter((item) => item.correct).length;
      const passed = correctCount * 100 >= content.questions.length * content.rules.passingPercent;
      const result: QuizResult = { passed, correctCount, total: content.questions.length, feedback };
      const next = { ...current, quiz_draft: answers, quiz_passed: current.quiz_passed || passed, last_quiz: result };
      return { simulation: finish(content, next, simulation.earned, passed ? "quiz" : undefined), result };
    }
    case "summary": {
      if (!readingsDone || !current.exercise_done || !current.quiz_passed) return fail(simulation, "learning_prerequisite");
      return { simulation: finish(content, { ...current, summary_done: true }, simulation.earned, "summary") };
    }
    case "request_practice": {
      if (!current.summary_done) return fail(simulation, "learning_prerequisite");
      const practice_state = current.practice_state === "approved" || current.practice_state === "pending" ? current.practice_state : "pending";
      return { simulation: { ...simulation, enrollment: { ...current, practice_state } } };
    }
    default:
      return fail(simulation, "learning_invalid_input");
  }
}

// Stands in for the adult validation that a leader records for a real learner.
export function simulatePracticeApproval(content: WorldContent, simulation: Simulation): Simulation {
  if (simulation.enrollment.practice_state !== "pending") return simulation;
  return finish(content, { ...simulation.enrollment, practice_state: "approved", practice_mode: "supervised" }, simulation.earned, "practice");
}
