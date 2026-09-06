<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SAL DA TERRA — repository map

Production-oriented ministry management for adolescents. Observable participation supports pastoral care; the product never evaluates faith or spirituality.

## Stack and commands

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Supabase Auth/PostgreSQL/RLS, Zod and Vitest. Use npm: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Conventions

- Server Components by default; Client Components only for interaction.
- Validate every mutation server-side and authorize it again at the data boundary.
- Keep domain rules in `src/services`; never duplicate attendance/radar thresholds in UI.
- Use soft deletion for students and migrations for every database change.
- Never expose the service-role/secret key, real minor data, or sensitive pastoral notes.

## Sources of truth

Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/RLS.md`, `docs/UX-FLOWS.md`, `docs/ROADMAP.md`, and `docs/DECISIONS.md` as relevant.

Before modifying code: read relevant docs, inspect the implementation, avoid regressions, and preserve conventions.

Before concluding: run lint, typecheck, tests, build, inspect `git diff`, and perform a security review.
