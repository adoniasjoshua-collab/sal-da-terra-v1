import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { excludedMigrations, localMigrationSql } from "../scripts/prepare-local-db.mjs";

const ministry = "20000000-0000-0000-0000-000000000001";
const leader = "50000000-0000-0000-0000-000000000001";
const admin = "50000000-0000-0000-0000-000000000002";
const learner = "50000000-0000-0000-0000-000000000003";
const fresh = "60000000-0000-0000-0000-000000000002";
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
const provision = (profile: string, name = "Zaine Revisora DEMO", scope = ministry) => rpc("public.provision_staff_access($1,$2,$3)", [scope, profile, name]);
const reissue = (member: string) => rpc<string>("public.issue_staff_access_link($1)", [member]);
async function memberId(profile: string) {
  await db.exec("reset role");
  return (await db.query<{ id: string }>("select id from public.ministry_members where profile_id=$1", [profile])).rows[0].id;
}

describe("staff access provisioning (embedded PostgreSQL)", () => {
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
    await db.query("insert into auth.users(id,email) values($1,'nova.lider@test.invalid')", [fresh]);
  });
  afterEach(async () => { await db.exec("rollback; reset role"); });
  afterAll(async () => { await db?.close(); });

  it("adds a new identity as an active leader who can be chosen as reviewer", async () => {
    await actor(admin);
    await provision(fresh);
    await db.exec("reset role");
    const row = await db.query<{ role: string; is_active: boolean; full_name: string }>(
      "select mm.role, mm.is_active, p.full_name from public.ministry_members mm join public.profiles p on p.id = mm.profile_id where mm.profile_id=$1", [fresh]);
    expect(row.rows[0]).toEqual({ role: "leader", is_active: true, full_name: "Zaine Revisora DEMO" });
    expect((await db.query("select 1 from public.audit_logs where action='provision_staff_access' and actor_id=$1", [admin])).rows).toHaveLength(1);
    await actor(admin);
    await rpc("public.learning_command($1,'configure',null,$2::jsonb)", [ministry, JSON.stringify({ author: admin, reviewer: fresh })]);
  });

  it("denies leaders, learners and other ministries", async () => {
    await actor(leader);
    await rejectsWith(() => provision(fresh), "staff_access_denied");
    await actor(learner);
    await rejectsWith(() => provision(fresh), "staff_access_denied");
    await actor(admin);
    await rejectsWith(() => provision(fresh, "Zaine", "20000000-0000-0000-0000-000000000099"), "staff_access_denied");
  });

  it("never repurposes existing accounts and validates the name", async () => {
    await actor(admin);
    await rejectsWith(() => provision(learner), "staff_access_identity");
    await rejectsWith(() => provision("60000000-0000-0000-0000-000000000099"), "staff_access_identity");
    await rejectsWith(() => provision(fresh, " "), "staff_access_invalid");
  });

  it("reissues links only for active leaders, never for admins or oneself", async () => {
    const leaderMember = await memberId(leader);
    const adminMember = await memberId(admin);
    await actor(admin);
    expect(await reissue(leaderMember)).toBe(leader);
    await rejectsWith(() => reissue(adminMember), "staff_access_inactive");
    await actor(leader);
    await rejectsWith(() => reissue(leaderMember), "staff_access_denied");
    await db.exec("reset role");
    expect((await db.query("select 1 from public.audit_logs where action='issue_staff_access_link'")).rows).toHaveLength(1);
  });
});
