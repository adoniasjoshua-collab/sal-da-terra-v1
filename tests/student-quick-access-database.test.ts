import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { excludedMigrations, localMigrationSql } from "../scripts/prepare-local-db.mjs";

const leader = "50000000-0000-0000-0000-000000000001";
const admin = "50000000-0000-0000-0000-000000000002";
const learner = "50000000-0000-0000-0000-000000000003";
const linkedStudent = "30000000-0000-0000-0000-000000000001";
const student = "30000000-0000-0000-0000-000000000002";
const fresh = "60000000-0000-0000-0000-000000000001";
const code = "pedra-4827-sol";
let db: PGlite;

async function actor(id: string | null) {
  await db.exec(`reset role; set role ${id ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
}
async function rpc<T = unknown>(sql: string, params: unknown[] = []) {
  return (await db.query<{ value: T }>(`select ${sql} as value`, params)).rows[0].value;
}
async function rejectsWith(action: () => Promise<unknown>, message: string) {
  await db.exec("savepoint expected_failure");
  await expect(action()).rejects.toThrow(message);
  await db.exec("rollback to savepoint expected_failure");
}
const provision = (username = "ana.souza", secret = code) =>
  rpc<string>("public.provision_student_quick_access($1,$2,$3,$4)", [student, fresh, username, secret]);
const issue = (target: string, secret: string) => rpc<string>("public.issue_student_access_code($1,$2)", [target, secret]);
const state = () => rpc<string>("public.my_access_code_state()");
async function passwordIs(profile: string, password: string) {
  await db.exec("reset role");
  return rpc<boolean>("(select encrypted_password = extensions.crypt($2, encrypted_password) from auth.users where id = $1)", [profile, password]);
}
async function setPassword(profile: string, password: string) {
  await db.exec("reset role");
  await db.query("update auth.users set encrypted_password = extensions.crypt($2, extensions.gen_salt('bf')) where id = $1", [profile, password]);
}

describe("student quick access (embedded PostgreSQL)", () => {
  beforeAll(async () => {
    db = new PGlite({ extensions: { pgcrypto } });
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
    // Identity created server-side without e-mail delivery, as the Auth Admin API does.
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'ana.souza@alunos.saldaterra.invalid',now())", [fresh]);
  });
  afterEach(async () => { await db.exec("rollback; reset role"); });
  afterAll(async () => { await db?.close(); });

  it("links the identity, writes the code as its password for 7 days and audits it", async () => {
    await actor(admin);
    const expires = new Date(await provision());
    const days = (expires.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThanOrEqual(7);
    expect(await passwordIs(fresh, code)).toBe(true);
    const row = await db.query("select s.auth_user_id, mm.role from public.students s join public.ministry_members mm on mm.profile_id = s.auth_user_id where s.id = $1", [student]);
    expect(row.rows).toEqual([{ auth_user_id: fresh, role: "student" }]);
    expect((await db.query("select 1 from public.audit_logs where action = 'issue_student_access_code' and actor_id = $1", [admin])).rows).toHaveLength(1);
    await actor(fresh);
    expect(await state()).toBe("active");
  });

  it("denies leaders, learners and anonymous callers", async () => {
    await actor(leader);
    await rejectsWith(() => provision(), "student_access_denied");
    await actor(learner);
    await rejectsWith(() => provision(), "student_access_denied");
    await actor(null);
    await rejectsWith(() => provision(), "permission denied");
  });

  it("rejects invalid usernames and weak codes, and never reuses a username", async () => {
    await actor(admin);
    await rejectsWith(() => provision("Ana Souza"), "student_username_invalid");
    await rejectsWith(() => provision("ana.souza", "123"), "student_access_code_invalid");
    await provision();
    await db.exec("reset role");
    await db.query("insert into auth.users(id,email) values('60000000-0000-0000-0000-000000000002','x@alunos.saldaterra.invalid')");
    await actor(admin);
    await rejectsWith(() => rpc("public.provision_student_quick_access($1,$2,$3,$4)", [linkedStudent, "60000000-0000-0000-0000-000000000002", "ana.souza", code]), "student_username_taken");
  });

  it("never exposes the stored hash and shows rows only to administrators", async () => {
    await actor(admin);
    await provision();
    expect((await db.query("select username from public.student_quick_access")).rows).toEqual([{ username: "ana.souza" }]);
    await rejectsWith(() => db.query("select code_hash from public.student_quick_access"), "permission denied");
    await actor(fresh);
    expect((await db.query("select username from public.student_quick_access")).rows).toEqual([]);
    await actor(leader);
    expect((await db.query("select username from public.student_quick_access")).rows).toEqual([]);
    await actor(null);
    await rejectsWith(() => db.query("select username from public.student_quick_access"), "permission denied");
  });

  it("ends the temporary phase only after a real, different personal password", async () => {
    await actor(admin);
    await provision();
    await actor(fresh);
    // Skipping the password change (or claiming a password that is not current) fails.
    await rejectsWith(() => rpc("public.complete_student_access_code($1)", [code]), "student_access_code_unchanged");
    await rejectsWith(() => rpc("public.complete_student_access_code($1)", ["MinhaSenha1"]), "student_access_code_unchanged");
    // Re-setting the code itself as the password (new salt) is still refused.
    await setPassword(fresh, code);
    await actor(fresh);
    await rejectsWith(() => rpc("public.complete_student_access_code($1)", [code]), "student_access_code_unchanged");
    await setPassword(fresh, "MinhaSenha1");
    await actor(fresh);
    await rpc("public.complete_student_access_code($1)", ["MinhaSenha1"]);
    expect(await state()).toBe("none");
  });

  it("invalidates an expired code in Auth, so it cannot be used outside the portal", async () => {
    await actor(admin);
    await provision();
    await db.exec("reset role");
    await db.query("update public.student_quick_access set code_expires_at = now() - interval '1 minute'");
    await actor(null);
    await rpc("public.expire_student_access_codes()");
    expect(await passwordIs(fresh, code)).toBe(false);
    await actor(fresh);
    expect(await state()).toBe("expired");
  });

  it("leaves personal passwords and valid codes untouched when expiring", async () => {
    await actor(admin);
    await provision();
    await actor(null);
    await rpc("public.expire_student_access_codes()");
    expect(await passwordIs(fresh, code)).toBe(true);
    await setPassword(fresh, "MinhaSenha1");
    await actor(fresh);
    await rpc("public.complete_student_access_code($1)", ["MinhaSenha1"]);
    await db.exec("reset role");
    await db.query("update public.student_quick_access set code_expires_at = null");
    await actor(null);
    await rpc("public.expire_student_access_codes()");
    expect(await passwordIs(fresh, "MinhaSenha1")).toBe(true);
  });

  it("issues a new code only for active quick-access students, by administrators", async () => {
    await actor(admin);
    await provision();
    await setPassword(fresh, "MinhaSenha1");
    await actor(fresh);
    await rpc("public.complete_student_access_code($1)", ["MinhaSenha1"]);
    await actor(leader);
    await rejectsWith(() => issue(student, "lua-1234-mar"), "student_access_denied");
    await actor(admin);
    await rejectsWith(() => issue(linkedStudent, "lua-1234-mar"), "student_access_missing");
    await issue(student, "lua-1234-mar");
    expect(await passwordIs(fresh, "lua-1234-mar")).toBe(true);
    await actor(fresh);
    expect(await state()).toBe("active");
    await db.exec("reset role");
    await db.query("update public.ministry_members set is_active=false where profile_id=$1", [fresh]);
    await actor(admin);
    await rejectsWith(() => issue(student, "lua-1234-mar"), "student_access_inactive");
  });

  it("reports no temporary code for e-mail accounts", async () => {
    await actor(learner);
    expect(await state()).toBe("none");
    await rpc("public.complete_student_access_code($1)", ["qualquer1"]);
  });
});
