import { beforeAll, describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareLocalDatabase, localMigrationSql } from "../scripts/prepare-local-db.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
let prepared;

describe("isolated local database preparation", () => {
  beforeAll(async () => {
    prepared = await prepareLocalDatabase(root);
  });

  it("preserves schema migrations with one explicit historical replay adaptation", async () => {
    const source = path.join(root, "supabase", "migrations");
    const all = (await readdir(source)).filter((name) => name.endsWith(".sql")).sort();
    const excluded = ["20260906220000_prepare_official_tenant.sql", "20260906221000_finalize_official_tenant.sql"];
    expect(prepared.excluded).toEqual(excluded);
    expect(prepared.included).toEqual(all.filter((name) => !excluded.includes(name)));
    const target = path.join(prepared.workdir, "supabase", "migrations");
    expect((await readdir(target)).sort()).toEqual(prepared.included);
    for (const name of prepared.included) {
      const original = await readFile(path.join(source, name), "utf8");
      const copied = await readFile(path.join(target, name), "utf8");
      if (name === "20260906150000_fix_scoped_relationship_triggers.sql") {
        expect(copied.match(/create or replace function public\.validate_/g)).toHaveLength(3);
        expect(copied.replace(/create or replace function public\.validate_/g, "create function public.validate_")).toBe(original);
      } else expect(copied).toBe(original);
    }
  });

  it("does not adapt other or future migrations", () => {
    const sql = "create function public.validate_student_scope() returns trigger";
    expect(localMigrationSql("20990101000000_future.sql", sql)).toBe(sql);
  });

  it("copies every SQL suite and fictitious seed without remote link metadata or environment files", async () => {
    const target = path.join(prepared.workdir, "supabase");
    expect((await readdir(target)).sort()).toEqual(["config.toml", "migrations", "seed.sql", "tests"]);
    expect(await readFile(path.join(target, "seed.sql"))).toEqual(await readFile(path.join(root, "supabase", "seed.sql")));
    const sourceTests = (await readdir(path.join(root, "supabase", "tests"))).filter((name) => name.endsWith(".sql")).sort();
    expect(prepared.tests).toEqual(sourceTests);
    for (const name of sourceTests) {
      expect(await readFile(path.join(target, "tests", name))).toEqual(await readFile(path.join(root, "supabase", "tests", name)));
    }
    const config = await readFile(path.join(target, "config.toml"), "utf8");
    expect(config).toContain('site_url = "http://localhost:3000"');
    expect(config).toContain("port = 55322");
    expect(config).not.toMatch(/https:|project-ref|service_role/);
  });

  it("creates a fresh workspace on each run without overwriting an earlier snapshot", async () => {
    const previous = await readFile(path.join(prepared.workdir, "manifest.json"));
    const next = await prepareLocalDatabase(root);
    expect(next.workdir).not.toBe(prepared.workdir);
    expect(path.relative(path.join(root, ".local-db"), next.workdir)).toMatch(/^run-[a-zA-Z0-9]+$/);
    expect(await readFile(path.join(prepared.workdir, "manifest.json"))).toEqual(previous);
  });
});
