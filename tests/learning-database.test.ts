import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import content from "../content/fundamentos/voce-faz-parte.v2.json";
import type { LearningSnapshot, LearningResult } from "../src/services/learning";
import { localMigrationSql } from "../scripts/prepare-local-db.mjs";

const ministry = "20000000-0000-0000-0000-000000000001";
const admin = "50000000-0000-0000-0000-000000000002";
const leader = "50000000-0000-0000-0000-000000000001";
const learner = "50000000-0000-0000-0000-000000000003";
const secondLearner = "50000000-0000-0000-0000-000000000004";
const student = "30000000-0000-0000-0000-000000000001";
const otherStudent = "30000000-0000-0000-0000-000000000002";
let db: PGlite;
async function actor(id: string) {
  await db.exec("reset role; set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
}
async function command(name: string, payload: object = {}, target: string | null = null, scope = ministry) {
  const result = await db.query<{ value: LearningResult }>("select public.learning_command($1,$2,$3,$4::jsonb) as value", [scope, name, target, JSON.stringify(payload)]);
  return result.rows[0].value;
}
// A failed statement aborts the per-test transaction; isolate expected failures.
async function rejectsWith(action: () => Promise<unknown>, message: string) {
  await db.exec("savepoint expected_failure");
  await expect(action()).rejects.toThrow(message);
  await db.exec("rollback to savepoint expected_failure");
}
async function snapshot(scope = ministry) {
  const result = await db.query<{ value: LearningSnapshot }>("select public.learning_snapshot($1) as value", [scope]);
  return result.rows[0].value;
}
async function publish() {
  await actor(admin);
  await command("configure", { author: admin, reviewer: leader });
  await command("submit_review");
  await actor(leader);
  await command("approve", { confirmed: true });
  await actor(admin);
  await command("publish", { confirmed: true });
}
async function enroll() {
  await publish();
  await command("enroll", { confirmed: true }, student);
  await actor(learner);
  return (await snapshot()).enrollment!.id;
}
async function readingsAndExercise(id: string) {
  for (const card of content.cards) await command("reading", { reading: card.id, answer: card.checkpoint.correct }, id);
  await command("exercise", { answer: content.exercise.correct }, id);
}
const correctAnswers = Object.fromEntries(content.questions.map((q) => [q.id, q.correct]));
const firstReading = { reading: content.cards[0].id, answer: content.cards[0].checkpoint.correct };

describe("learning SQL authorization and progression (embedded PostgreSQL)", () => {
  beforeAll(async () => {
    db = new PGlite({ extensions: { pgcrypto } });
    // Only the Supabase Auth boundary is stubbed. Application schema, RLS,
    // triggers and RPCs below use the same replay adaptation as db:prepare.
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create schema extensions;
      create table auth.users(id uuid primary key, instance_id uuid, aud text, role text,
        email text, encrypted_password text, email_confirmed_at timestamptz,
        raw_app_meta_data jsonb, raw_user_meta_data jsonb, confirmation_token text,
        recovery_token text, email_change text, email_change_token_new text,
        created_at timestamptz, updated_at timestamptz);
      create table auth.identities(provider_id text, user_id uuid references auth.users(id),
        identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz,
        updated_at timestamptz, unique(provider_id,provider));
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;`);
    const directory = path.join(process.cwd(), "supabase/migrations");
    for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
      if (["20260906220000_prepare_official_tenant.sql", "20260906221000_finalize_official_tenant.sql"].includes(name)) continue;
      await db.exec(localMigrationSql(name, await readFile(path.join(directory, name), "utf8")));
    }
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
    await db.exec(`insert into auth.users(id,email) values('${secondLearner}','second@test.invalid');
      insert into public.profiles(id,full_name) values('${secondLearner}','Second Learner DEMO');
      insert into public.ministry_members(ministry_id,profile_id,role) values('${ministry}','${secondLearner}','student');
      update public.students set auth_user_id='${secondLearner}' where id='${otherStudent}';`);
  }, 60000);
  beforeEach(async () => { await db.exec("begin"); });
  afterEach(async () => { await db.exec("rollback; reset role"); });
  afterAll(async () => { await db?.close(); });

  it("lets only an administrator be both author and reviewer", async () => {
    await actor(admin);
    await rejectsWith(() => command("configure", { author: leader, reviewer: leader }), "learning_invalid_editors");
    await command("configure", { author: admin, reviewer: admin });
    await command("submit_review");
    await command("approve", { confirmed: true });
    await command("publish", { confirmed: true });
    await actor(leader);
    expect((await snapshot()).publication!.state).toBe("published");
    await db.exec("reset role");
    const audit = await db.query<{ action: string }>("select action from public.audit_logs where action like 'learning_%' order by created_at");
    expect(audit.rows.map((row) => row.action)).toEqual(["learning_configure", "learning_submit_review", "learning_approve", "learning_publish"]);
  });

  it("does not expose unpublished content or enroll before publication", async () => {
    await actor(admin);
    await command("configure", { author: admin, reviewer: leader });
    await actor(learner);
    expect((await snapshot()).content).toBeNull();
    await actor(admin);
    await expect(command("enroll", { confirmed: true }, student)).rejects.toThrow("learning_access_denied");
  });

  it("keeps approval with the assigned reviewer when the administrator is only the author", async () => {
    await actor(admin);
    await command("configure", { author: admin, reviewer: leader });
    await command("submit_review");
    await expect(command("approve", { confirmed: true })).rejects.toThrow("learning_invalid_transition");
  });

  it("lets only an administrator recall a stalled review back to draft with a reason", async () => {
    await actor(admin);
    await command("configure", { author: admin, reviewer: leader });
    await command("submit_review");
    await actor(leader);
    await rejectsWith(() => command("recall", { note: "Revisor indisponível." }), "learning_invalid_transition");
    await actor(admin);
    await rejectsWith(() => command("recall", { note: "curto" }), "learning_invalid_transition");
    await command("recall", { note: "Revisor indisponível para concluir." });
    await actor(leader);
    const recalled = (await snapshot()).publication!;
    expect(recalled.state).toBe("draft");
    expect(recalled.review_note).toBe("Revisor indisponível para concluir.");
    await actor(admin);
    await command("configure", { author: leader, reviewer: admin });
    await db.exec("reset role");
    const audit = await db.query<{ count: number }>("select count(*)::int as count from public.audit_logs where action = 'learning_recall'");
    expect(audit.rows[0].count).toBe(1);
  });

  it("discards a prior approval when an administrator recalls it", async () => {
    await actor(admin);
    await command("configure", { author: admin, reviewer: leader });
    await command("submit_review");
    await actor(leader);
    await command("approve", { confirmed: true });
    await db.exec("reset role");
    await db.query("update public.ministry_members set is_active=false where profile_id=$1 and ministry_id=$2", [leader, ministry]);
    await actor(admin);
    await rejectsWith(() => command("publish", { confirmed: true }), "learning_invalid_transition");
    await command("recall", { note: "Revisor desligado antes da publicação." });
    await db.exec("reset role");
    const row = await db.query<{ state: string; approved_by: string | null }>("select state, approved_by from public.learning_publications");
    expect(row.rows[0]).toEqual({ state: "draft", approved_by: null });
  });

  it("hides answer keys and other students from the learner projection", async () => {
    await enroll();
    const data = await snapshot();
    expect(data.content?.questions[0]).not.toHaveProperty("correct");
    expect(data.content?.questions[0]).not.toHaveProperty("explanation");
    expect(data.content?.exercise).not.toHaveProperty("correct");
    expect(data.content?.version).toBe(2);
    for (const card of data.content!.cards) {
      expect(card.checkpoint.prompt).toBeTruthy();
      expect(card.checkpoint).not.toHaveProperty("correct");
      expect(card.checkpoint).not.toHaveProperty("explanation");
    }
    expect(data.students).toEqual([]);
    expect(data.editors).toEqual([]);
    expect(data.enrollment).not.toHaveProperty("review_note");
  });

  it("counts a reading only after a correct checkpoint answer", async () => {
    const id = await enroll();
    const card = content.cards[0];
    const wrong = (card.checkpoint.correct + 1) % card.checkpoint.options.length;
    await rejectsWith(() => command("reading", { reading: card.id }, id), "learning_invalid_input");
    const missed = await command("reading", { reading: card.id, answer: wrong }, id);
    expect(missed.correct).toBe(false);
    expect(missed.explanation).toBe(card.checkpoint.explanation);
    expect((await snapshot()).enrollment?.readings).toEqual([]);
    expect((await command("reading", firstReading, id)).correct).toBe(true);
    expect((await snapshot()).enrollment?.readings).toEqual([card.id]);
  });

  it("denies another learner's enrollment even in the same ministry", async () => {
    const id = await enroll();
    await actor(secondLearner);
    expect((await snapshot()).enrollment).toBeNull();
    await expect(command("reading", { reading: "conhecido" }, id)).rejects.toThrow("learning_access_denied");
  });

  it("denies another ministry", async () => {
    await actor(admin);
    await expect(snapshot("20000000-0000-0000-0000-000000000099")).rejects.toThrow("learning_access_denied");
  });

  it("denies anonymous RPC execution", async () => {
    await db.exec("set role anon");
    await expect(snapshot()).rejects.toThrow("permission denied");
  });

  it("does not let a leader enroll a student without admin authorization", async () => {
    await publish();
    await actor(leader);
    await expect(command("enroll", { confirmed: true }, student)).rejects.toThrow("learning_access_denied");
  });

  it("rejects a request id reused with different quiz answers", async () => {
    const id = await enroll();
    await readingsAndExercise(id);
    const requestId = "a0000000-0000-4000-8000-000000000005";
    await command("quiz", { answers: correctAnswers, requestId }, id);
    await expect(command("quiz", { answers: { ...correctAnswers, q1: 0 }, requestId }, id)).rejects.toThrow("learning_request_conflict");
  });

  it("rejects unrelated fields in quiz drafts", async () => {
    const id = await enroll();
    await readingsAndExercise(id);
    await expect(command("save_draft", { answers: { private_note: "Do not collect this" } }, id)).rejects.toThrow("learning_invalid_input");
  });

  it("keeps earned progress after a later unsuccessful attempt", async () => {
    const id = await enroll();
    await readingsAndExercise(id);
    await command("quiz", { answers: correctAnswers, requestId: "a0000000-0000-4000-8000-000000000006" }, id);
    await command("quiz", { answers: { q1: 0, q2: 0, q3: 1, q4: 0, q5: 0 }, requestId: "a0000000-0000-4000-8000-000000000007" }, id);
    expect((await snapshot()).enrollment?.quiz_passed).toBe(true);
    expect((await snapshot()).enrollment?.xp).toBe(content.rules.xp.reading + content.rules.xp.exercise + content.rules.xp.quiz);
  });

  it("withdraws access and reactivates the same enrollment without resetting progress", async () => {
    const id = await enroll();
    await command("reading", firstReading, id);
    await actor(admin);
    await command("withdraw", {}, id);
    await actor(learner);
    expect((await snapshot()).enrollment).toBeNull();
    await actor(admin);
    await command("enroll", { confirmed: true }, student);
    await actor(learner);
    expect((await snapshot()).enrollment?.id).toBe(id);
    expect((await snapshot()).enrollment?.readings).toEqual(["conhecido"]);
  });

  it("denies direct base-table access to learners", async () => {
    await actor(learner);
    await expect(db.query("select * from public.learning_versions")).rejects.toThrow("permission denied");
  });

  it("denies direct XP and score forgery", async () => {
    const id = await enroll();
    await expect(db.query("update public.learning_enrollments set quiz_passed=true where id=$1", [id])).rejects.toThrow("permission denied");
  });

  it("rejects skipped prerequisites", async () => {
    const id = await enroll();
    await expect(command("summary", {}, id)).rejects.toThrow("learning_prerequisite");
  });

  it("saves educational drafts and scores on the server without repeated XP", async () => {
    const id = await enroll();
    await readingsAndExercise(id);
    await command("reading", { reading: "conhecido" }, id);
    await command("save_draft", { answers: { q1: 0, q2: 2 } }, id);
    expect((await snapshot()).enrollment?.quiz_draft).toEqual({ q1: 0, q2: 2 });
    const failing = await command("quiz", { answers: { q1: 0, q2: 2, q3: 0, q4: 0, q5: 0 }, requestId: "a0000000-0000-4000-8000-000000000001", passed: true, score: 100 }, id);
    expect(failing.passed).toBe(false);
    expect(failing.correctCount).toBe(2);
    const requestId = "a0000000-0000-4000-8000-000000000002";
    const result = await command("quiz", { answers: correctAnswers, requestId }, id);
    expect(result.passed).toBe(true);
    expect(await command("quiz", { answers: correctAnswers, requestId }, id)).toEqual(result);
    await command("quiz", { answers: correctAnswers, requestId: "a0000000-0000-4000-8000-000000000003" }, id);
    expect((await snapshot()).enrollment?.xp).toBe(content.rules.xp.reading + content.rules.xp.exercise + content.rules.xp.quiz);
    await db.exec("reset role");
    const attempts = await db.query<{ count: number }>("select count(*)::int as count from public.learning_quiz_attempts");
    expect(attempts.rows[0].count).toBe(3);
  });

  it("requires adult validation, supports equivalence and awards the badge only at completion", async () => {
    const id = await enroll();
    await readingsAndExercise(id);
    await command("quiz", { answers: correctAnswers, requestId: "a0000000-0000-4000-8000-000000000004" }, id);
    await command("summary", {}, id);
    await command("summary", {}, id);
    await command("request_practice", {}, id);
    expect((await snapshot()).enrollment?.completed_at).toBeNull();
    await actor(leader);
    await command("review_practice", { decision: "changes_requested", mode: "equivalent", note: "Combinar simulação supervisionada." }, id);
    await actor(learner);
    await command("request_practice", {}, id);
    await actor(leader);
    await command("review_practice", { decision: "approved", mode: "equivalent", note: "Simulação educacional realizada com supervisão." }, id);
    await actor(learner);
    const completed = (await snapshot()).enrollment!;
    expect(completed.completed_at).not.toBeNull();
    expect(completed.xp).toBe(220);
    expect(completed.practice_mode).toBe("equivalent");
    expect(completed).not.toHaveProperty("review_note");
    await command("request_practice", {}, id);
    expect((await snapshot()).enrollment?.xp).toBe(220);
    await actor(leader);
    const reviews = (await snapshot()).students.find((s) => s.id === student)?.enrollment?.reviews;
    expect(reviews).toHaveLength(2);
  });

  it("does not allow students to validate their own practice", async () => {
    const id = await enroll();
    await expect(command("review_practice", { decision: "approved", mode: "supervised", note: "Forged validation attempt." }, id)).rejects.toThrow("learning_access_denied");
  });

  it("revokes learning access immediately when membership is disabled", async () => {
    await enroll();
    await actor(admin);
    await db.query("update public.ministry_members set is_active=false where profile_id=$1 and ministry_id=$2", [learner, ministry]);
    await actor(learner);
    await expect(snapshot()).rejects.toThrow("learning_access_denied");
  });

  it("preserves progress when publication is archived but forbids further writes", async () => {
    const id = await enroll();
    await command("reading", firstReading, id);
    await actor(admin);
    await command("archive");
    await actor(learner);
    const archived = await snapshot();
    expect(archived.content).toBeNull();
    expect(archived.enrollment?.readings).toEqual(["conhecido"]);
    await expect(command("reading", { reading: "acolhido" }, id)).rejects.toThrow("learning_unavailable");
  });

  it("keeps an archived world readable, without answer keys or writes, for learners who completed it", async () => {
    const id = await enroll();
    await readingsAndExercise(id);
    await command("quiz", { answers: correctAnswers, requestId: "a0000000-0000-4000-8000-000000000008" }, id);
    await command("summary", {}, id);
    await command("request_practice", {}, id);
    await actor(leader);
    await command("review_practice", { decision: "approved", mode: "supervised", note: "Acolhimento supervisionado realizado." }, id);
    await actor(admin);
    await command("archive");
    await actor(learner);
    const archived = await snapshot();
    expect(archived.publication?.state).toBe("archived");
    expect(archived.content?.title).toBe(content.title);
    expect(archived.content?.questions[0]).not.toHaveProperty("correct");
    await expect(command("exercise", { answer: 0 }, id)).rejects.toThrow("learning_unavailable");
  });

  it("records who reactivated an enrollment", async () => {
    const id = await enroll();
    await actor(admin);
    await command("withdraw", {}, id);
    await db.exec("reset role");
    await db.query("update public.learning_enrollments set enrolled_by=$1 where id=$2", [leader, id]);
    await actor(admin);
    await command("enroll", { confirmed: true }, student);
    await db.exec("reset role");
    const row = await db.query<{ enrolled_by: string }>("select enrolled_by from public.learning_enrollments where id=$1", [id]);
    expect(row.rows[0].enrolled_by).toBe(admin);
  });
});
