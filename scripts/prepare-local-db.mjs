import { copyFile, mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Historical production data operations, not schema migrations. Never rewrite
// their originals or synthesize the real account they require in a local seed.
export const excludedMigrations = [
  "20260906220000_prepare_official_tenant.sql",
  "20260906221000_finalize_official_tenant.sql",
];

export const adaptedMigration = "20260906150000_fix_scoped_relationship_triggers.sql";
export function localMigrationSql(name, sql) {
  if (name !== adaptedMigration) return sql;
  // The initial migration already contains these functions. Historical replay
  // must replace them, not recreate them. Only the disposable copy is adapted.
  return sql.replace(/create function public\.(validate_student_scope|validate_attendance_scope|validate_followup_scope)\(/g, "create or replace function public.$1(");
}

export async function prepareLocalDatabase(root) {
  const source = path.join(root, "supabase");
  const migrations = (await readdir(path.join(source, "migrations")))
    .filter((name) => name.endsWith(".sql")).sort();
  for (const name of excludedMigrations) {
    if (!migrations.includes(name)) throw new Error(`Historical migration missing: ${name}`);
  }
  const included = migrations.filter((name) => !excludedMigrations.includes(name));
  const tests = (await readdir(path.join(source, "tests")))
    .filter((name) => name.endsWith(".sql")).sort();
  const parent = path.join(root, ".local-db");
  await mkdir(parent, { recursive: true });
  const workdir = await mkdtemp(path.join(parent, "run-"));
  const target = path.join(workdir, "supabase");
  await mkdir(path.join(target, "migrations"), { recursive: true });
  await mkdir(path.join(target, "tests"));
  for (const name of included) {
    const sql = await readFile(path.join(source, "migrations", name), "utf8");
    await writeFile(path.join(target, "migrations", name), localMigrationSql(name, sql));
  }
  for (const name of tests) {
    await copyFile(path.join(source, "tests", name), path.join(target, "tests", name));
  }
  await copyFile(path.join(source, "seed.sql"), path.join(target, "seed.sql"));
  // Explicit local configuration: no remote URLs, project-ref, .env or credentials.
  await writeFile(path.join(target, "config.toml"), `project_id = "sal-da-terra-test-${path.basename(workdir).toLowerCase()}"

[api]
enabled = true
port = 55321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 55322
shadow_port = 55320
major_version = 17

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]

[studio]
enabled = false

[inbucket]
enabled = false

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/**", "http://127.0.0.1:3000/**"]
enable_signup = false

[analytics]
enabled = false
`);
  const manifest = { included, excluded: excludedMigrations, adapted: [adaptedMigration], tests };
  await writeFile(path.join(workdir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return { workdir, ...manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const result = await prepareLocalDatabase(root);
  const relative = path.relative(root, result.workdir).split(path.sep).join("/");
  console.log(`Prepared ${result.included.length} migrations and ${result.tests.length} SQL suites.`);
  console.log(`Manifest: ${relative}/manifest.json`);
  console.log("No database command was executed. With Docker running, use:");
  console.log(`supabase --workdir "${relative}" start`);
  console.log(`supabase --workdir "${relative}" test db --local`);
  console.log(`supabase --workdir "${relative}" stop`);
}
