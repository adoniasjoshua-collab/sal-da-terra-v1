import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { excludedMigrations, localMigrationSql } from "../scripts/prepare-local-db.mjs";
import content from "../content/fundamentos/voce-faz-parte.v2.json";
import type { LearningSnapshot } from "../src/services/learning";

const ministry = "20000000-0000-0000-0000-000000000001";
const leader = "50000000-0000-0000-0000-000000000001";
const admin = "50000000-0000-0000-0000-000000000002";
const learner = "50000000-0000-0000-0000-000000000003";
const linkedStudent = "30000000-0000-0000-0000-000000000001";
const student = "30000000-0000-0000-0000-000000000002";
const fresh = "60000000-0000-0000-0000-000000000001";
let db: PGlite;

async function actor(id: string) {
  await db.exec("reset role; set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
}
async function rpc<T = unknown>(sql: string, params: unknown[]) {
  return (await db.query<{ value: T }>(`select ${sql} as value`, params)).rows[0].value;
}
// A failed statement aborts the per-test transaction; isolate expected failures.
async function rejectsWith(action: () => Promise<unknown>, message: string) {
  await db.exec("savepoint expected_failure");
  await expect(action()).rejects.toThrow(message);
  await db.exec("rollback to savepoint expected_failure");
}
const provision = (target: string, profile: string) => rpc("public.provision_student_access($1,$2)", [target, profile]);
const reissue = (target: string) => rpc<string>("public.issue_student_access_link($1)", [target]);
const createTest = () => rpc<string>("public.create_test_student($1)", [ministry]);

describe("student access provisioning (embedded PostgreSQL)", () => {
  beforeAll(async () => {
    db = new PGlite({ extensions: { pgcrypto } });
    // Only the Supabase Auth boundary is stubbed; schema, triggers and RPCs are real.
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
      if (excludedMigrations.includes(name)) continue;
      await db.exec(localMigrationSql(name, await readFile(path.join(directory, name), "utf8")));
    }
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
  }, 60000);
  beforeEach(async () => {
    await db.exec("begin");
    // A brand-new invited identity, as created server-side by the Auth Admin API.
    await db.query("insert into auth.users(id,email) values($1,'novo.aluno@test.invalid')", [fresh]);
  });
  afterEach(async () => { await db.exec("rollback; reset role"); });
  afterAll(async () => { await db?.close(); });

  it("links a new identity as an active student and audits it", async () => {
    await actor(admin);
    await provision(student, fresh);
    await db.exec("reset role");
    const row = await db.query<{ auth_user_id: string; role: string; is_active: boolean; full_name: string }>(
      `select s.auth_user_id, mm.role, mm.is_active, p.full_name from public.students s
       join public.ministry_members mm on mm.profile_id = s.auth_user_id join public.profiles p on p.id = s.auth_user_id where s.id = $1`, [student]);
    expect(row.rows[0]).toEqual({ auth_user_id: fresh, role: "student", is_active: true, full_name: "Ana Souza DEMO" });
    const audit = await db.query("select 1 from public.audit_logs where action = 'provision_student_access' and actor_id = $1", [admin]);
    expect(audit.rows).toHaveLength(1);
  });

  it("gives the new student only the learner view", async () => {
    await actor(admin);
    await provision(student, fresh);
    await actor(fresh);
    const profile = await db.query<{ full_name: string }>("select full_name from public.get_my_student_profile()");
    expect(profile.rows).toEqual([{ full_name: "Ana Souza DEMO" }]);
    expect((await db.query("select id from public.students")).rows).toEqual([]);
  });

  it("denies leaders and learners", async () => {
    await actor(leader);
    await rejectsWith(() => provision(student, fresh), "student_access_denied");
    await actor(learner);
    await rejectsWith(() => provision(student, fresh), "student_access_denied");
  });

  it("never repurposes an existing account, even a staff one", async () => {
    await actor(admin);
    await rejectsWith(() => provision(student, leader), "student_access_identity");
    await rejectsWith(() => provision(student, "60000000-0000-0000-0000-000000000099"), "student_access_identity");
  });

  it("refuses a student that already has access or is archived", async () => {
    await actor(admin);
    await rejectsWith(() => provision(linkedStudent, fresh), "student_access_exists");
    await db.query("update public.students set status='archived', is_active=false, archived_at=now() where id=$1", [student]);
    await rejectsWith(() => provision(student, fresh), "student_access_inactive");
  });

  it("authorizes and audits new links only for active linked students", async () => {
    await actor(admin);
    expect(await reissue(linkedStudent)).toBe(learner);
    await rejectsWith(() => reissue(student), "student_access_missing");
    await actor(leader);
    await rejectsWith(() => reissue(linkedStudent), "student_access_denied");
    await actor(admin);
    await db.query("update public.ministry_members set is_active=false where profile_id=$1", [learner]);
    await rejectsWith(() => reissue(linkedStudent), "student_access_inactive");
    await db.exec("reset role");
    expect((await db.query("select 1 from public.audit_logs where action = 'issue_student_access_link'")).rows).toHaveLength(1);
  });

  it("creates at most three fictitious test students, only for administrators", async () => {
    await actor(leader);
    await rejectsWith(() => createTest(), "student_access_denied");
    await actor(admin);
    const id = await createTest();
    await createTest();
    await createTest();
    await rejectsWith(() => createTest(), "student_test_limit");
    await db.exec("reset role");
    const row = await db.query<{ is_test: boolean; created_by: string }>("select is_test, created_by from public.students where id=$1", [id]);
    expect(row.rows[0]).toEqual({ is_test: true, created_by: admin });
  });

  it("does not let API roles hide a real adolescent as test data", async () => {
    await actor(leader);
    await db.query("update public.students set is_test=true where id=$1", [student]);
    await db.query(`insert into public.students(ministry_id, full_name, birth_date, guardian_name, guardian_phone, guardian_relationship, created_by, is_test)
      values($1,'Novo Cadastro DEMO','2012-01-01','Resp DEMO','(00) 90000-0009','Mãe',$2,true)`, [ministry, leader]);
    await db.exec("reset role");
    const flagged = await db.query("select id from public.students where is_test");
    expect(flagged.rows).toEqual([]);
  });

  it("lets a provisioned test student study the published first world with private progress", async () => {
    const learning = (command: string, target: string | null = null, payload: object = {}) =>
      rpc("public.learning_command($1,$2,$3,$4::jsonb)", [ministry, command, target, JSON.stringify(payload)]);
    const snapshot = () => rpc<LearningSnapshot>("public.learning_snapshot($1)", [ministry]);
    await actor(admin);
    const testStudent = await createTest();
    await provision(testStudent, fresh);
    await learning("configure", null, { author: admin, reviewer: leader });
    await learning("submit_review");
    await actor(leader);
    await learning("approve", null, { confirmed: true });
    await actor(admin);
    await learning("publish", null, { confirmed: true });
    await learning("enroll", testStudent, { confirmed: true });
    await actor(fresh);
    const started = await snapshot();
    expect(started.content?.title).toBe(content.title);
    expect(started.students).toEqual([]);
    expect(started.content?.exercise).not.toHaveProperty("correct");
    const enrollment = started.enrollment!.id;
    for (const card of content.cards) await learning("reading", enrollment, { reading: card.id, answer: card.checkpoint.correct });
    await learning("exercise", enrollment, { answer: content.exercise.correct });
    await learning("quiz", enrollment, {
      answers: Object.fromEntries(content.questions.map((q) => [q.id, q.correct])),
      requestId: "a0000000-0000-4000-8000-000000000009",
    });
    await learning("summary", enrollment);
    await learning("request_practice", enrollment);
    expect((await snapshot()).enrollment?.completed_at).toBeNull();
    await actor(admin);
    await learning("review_practice", enrollment, { decision: "approved", mode: "equivalent", note: "Simulação fictícia concluída pela administração." });
    await actor(fresh);
    const finished = await snapshot();
    expect(finished.enrollment?.completed_at).not.toBeNull();
    expect(finished.enrollment?.xp).toBe(220);
    expect((await db.query("select id from public.pastoral_followups")).rows).toEqual([]);
  });
});
