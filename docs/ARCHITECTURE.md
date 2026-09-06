# Architecture

The App Router renders authenticated data on the server. Supabase SSR carries sessions in cookies; every query still runs as the caller and is constrained by PostgreSQL RLS. Server Actions validate input with Zod, re-check the session, mutate through the RLS-scoped client, and revalidate affected routes.

`churches → ministries → ministry_members` provides future tenant isolation. `profiles` maps Auth identities; a `student` may optionally map to one Auth identity. Feature UI lives under `src/app/(app)`, reusable presentation under `src/components`, data/auth utilities under `src/lib`, and framework-independent rules under `src/services`.

Future learning entities attach to `ministry_id` and `student_id`; no V1 table encodes assumptions that prevent courses, lessons, progress, media, quizzes, missions, XP, achievements, or certificates.
