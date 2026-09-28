import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import content from "../content/fundamentos/voce-faz-parte.v1.json";
import { learningCommandSchema, learningProgress, type Enrollment } from "../src/services/learning";

describe("world one content and command boundary", () => {
  it("keeps the database content snapshot equal to the reviewed source artifact", () => {
    const sql = readFileSync("supabase/migrations/20260927121000_learning_world_one_content.sql", "utf8");
    const snapshot = sql.split("$content$")[1];
    expect(JSON.parse(snapshot)).toEqual(content);
  });
  it("has complete educational content with coherent answer keys and unique stable IDs", () => {
    expect(content.cards.length).toBeGreaterThanOrEqual(3);
    expect(content.cards.length).toBeLessThanOrEqual(5);
    expect(new Set(content.cards.map((card) => card.id)).size).toBe(content.cards.length);
    for (const card of content.cards) expect(card.paragraphs.join(" ").length).toBeGreaterThan(600);
    expect(content.questions).toHaveLength(4);
    for (const q of [content.exercise, ...content.questions]) {
      expect(q.options[q.correct]).toBeTruthy();
      expect(q.explanation.length).toBeGreaterThan(30);
    }
    expect(Object.values(content.rules.xp).reduce((sum, value) => sum + value, 0)).toBe(220);
  });
  it("drops caller-supplied score and XP and requires an idempotency key", () => {
    const result = learningCommandSchema.parse({ command: "quiz", target: "a0000000-0000-4000-8000-000000000001", answers: { q1: 0 }, requestId: "a0000000-0000-4000-8000-000000000002", score: 100, xp: 999 });
    expect(result).not.toHaveProperty("score");
    expect(result).not.toHaveProperty("xp");
    expect(learningCommandSchema.safeParse({ command: "quiz", target: "a0000000-0000-4000-8000-000000000001", answers: {} }).success).toBe(false);
  });
  it("requires explicit enrollment/publication confirmation and a review justification", () => {
    expect(learningCommandSchema.safeParse({ command: "publish", confirmed: false }).success).toBe(false);
    expect(learningCommandSchema.safeParse({ command: "recall", note: "curto" }).success).toBe(false);
    expect(learningCommandSchema.safeParse({ command: "recall", note: "Revisor indisponível." }).success).toBe(true);
    expect(learningCommandSchema.safeParse({ command: "review_practice", target: "a0000000-0000-4000-8000-000000000001", decision: "approved", mode: "equivalent", note: "" }).success).toBe(false);
  });
  it("does not count unrelated or duplicate reading IDs as progress", () => {
    const enrollment = { readings: ["conhecido", "conhecido", "forged"], exercise_done: true, quiz_passed: false, summary_done: false, practice_state: "pending" } as Enrollment;
    expect(learningProgress(enrollment, content)).toEqual({ done: 2, total: 8, percent: 25 });
  });
});
