# Architecture decisions

## ADR-008 — Versioned season and isolated database validation (2026-09-27)

The next Hub increment follows `HUB-SEASON-01.md`. Existing ministry identity,
attendance and pastoral rules remain independent of educational progress.
The season contract records proposed completion/XP rules separately from human
editorial approval; no publication or production migration is implied.

Local validation uses `npm run db:prepare` to copy schema migrations, fictitious
seed and SQL tests into a new ignored workspace. Only the two historical
DEMO-to-official data operations are excluded, explicitly recorded in a manifest.
Original migrations remain unchanged. This validates a local schema, not remote
migration parity; see `LOCAL-DATABASE.md`.

Replay also adapts three `CREATE FUNCTION` statements to `CREATE OR REPLACE`
in the disposable copy of the historical scope-trigger fix, because the initial
migration already defines them. The manifest records the adaptation.

## ADR-009 — World-one learning boundary

Learning content is an immutable JSON version stored by an additive migration.
Ministry publications assign adult author/reviewer identities and enforce
editorial transitions. Admins authorize student enrollment after publication.
Since 2026-10-02 (pilot decision) an active admin may be both author and reviewer;
a leader author still needs a different reviewer, and leaders never self-approve.
Self-review keeps the explicit, audited submit/approve/publish steps.
Completion, quiz scoring, practical review and XP are written atomically by
`learning_command`; `learning_snapshot` returns a role-scoped projection.
Base tables have RLS enabled and no API grants/policies. Neither answer keys nor
adult review notes are included in the learner projection.

The adapter serves the newest version of world one (version 2 since 2026-10-02,
see `20261002130000_learning_world_one_v2.sql`). A new version starts a fresh draft
publication, so a live version must be archived before the next one ships.
Version 2 adds per-reading checkpoints graded by `learning_command`; their keys
are stripped from the learner projection like quiz keys. Expanding to more worlds
requires extending the adapter while preserving existing enrollments.
Rules come from the same content snapshot used for editorial review, not from
frontend constants. Private badges derive from the persisted completion timestamp
and versioned label. No certificate eligibility or historic attendance is inferred.

## ADR-001 — Tenant membership table

Roles belong to a ministry membership, not a global JWT claim. This allows one account to have different authorized roles in different ministries.

## ADR-002 — Database-enforced authorization

RLS and relationship triggers enforce scope. Server UI checks cannot replace them.

## ADR-003 — Transparent operational radar

Radar is derived from consecutive ordinary EBD absences: 0–1 active, 2 attention, 3 follow-up, 4+ priority. Justified absences do not count as ordinary absence. It is not a spiritual evaluation.

## ADR-004 — No service role in web runtime

All application queries use the caller's publishable-key session. Privileged lifecycle operations belong in separately reviewed admin infrastructure.

## ADR-005 — Event participation is not one universal frequency

EBD uses a full roster and remains the sole input for EBD frequency and the V1 pastoral radar. Optional events record observable participation with a neutral `not_participated` state. Other event categories appear as timeline context and are never converted into a spiritual or global engagement score.

## ADR-006 — Data-minimized event counting

Events support three exclusive collection modes: full roster, identified participants without absences, and aggregate headcount without names. Aggregate counting is the privacy-preserving default for worship services, evangelism and open congresses. Participation volume can use either source, but unique people are reported only when identities were legitimately collected. Existing event modes are never rewritten after records exist.

## ADR-007 — Age-based alerts support, but do not automate, ministry transitions

The ministry defines its operational adolescent range as ages 11–15 inclusive (updated on 2026-09-21). Age 15 remains within the range and is labeled **transitioning**; age 16+ is **transition due**. Children under 11 are **outside range**. These values are derived from the authorized birth date using the ministry's São Paulo reference date; they do not mutate or archive records. The leadership decides the actual handoff date and preserves history. Birthday reminders are staff-only, have no ranking or spiritual meaning, and use no additional personal data.

## ADR-010 — Admin-issued student access links (2026-09-28)

Adolescents use the same login as staff; the active membership role decides
what they see. Admins create access from the adolescent profile with an e-mail
(adolescent or guardian) and share a personal link (copy/WhatsApp) instead of
depending on project SMTP. The service-role key stays server-only and is used
only for the Auth Admin API; linking and auditing run in admin-scoped RPCs.
Links land on a side-effect-free page because messaging previews and scanners
prefetch URLs; the token is verified on explicit confirmation. Students use a
shorter password rule (8+, letters and number); staff keep the strong rule.
Admins rehearse the flow with fictitious `is_test` records excluded from
pastoral indicators.

## ADR-011 — Supplementary video outside the versioned content (2026-11-08)

The administrator-reviewer approved a YouTube video for the already published
World 1. A new content version would return the world to draft and strand
enrollments tied to the current publication, so this is a deliberate exception
to "published changes create a new version": the video is registered in
`src/services/learning-media.ts`, keyed by world and version, and the versioned
JSON stays untouched. It is optional, grants no XP, gates nothing, and the
readings remain the textual alternative. Embeds use a validated identifier on
`youtube-nocookie.com` and load only after the learner presses play. Changes
that affect readings, questions or rules still require a new version.

## ADR-012 — Quick student access without e-mail (2026-11-11)

Requiring an e-mail per adolescent and a short-lived one-time link blocked
access in practice. A predictable default such as "first name + 123" was
rejected: any classmate could open another minor's account. Admins now generate
a username (`primeironome.sobrenome`) and a random temporary code
(word-4 digits-word, ~26 bits, CSPRNG) shown once and shared by WhatsApp. The
Auth identity uses an internal `@alunos.saldaterra.invalid` address that never
receives mail. The code is valid for 7 days and is replaced by a personal
password at the first sign-in; the database refuses to end that phase unless the
current password differs from the code. Expired codes are overwritten in Auth
with a random password (pg_cron and before each portal sign-in), so they cannot
be used through the API either. Login failures use one generic message. E-mail
invitations (ADR-010) remain available.

## ADR-013 — Revista Gamificada as file-based classroom content (2026-11-15)

The EBD adolescents' lesson player lives at `/conhecimento/revista`. Each lesson
is a JSON file in `content/revista/licoes/`, validated by Zod in
`src/services/revista.ts`; launching a lesson only requires editing data
(`content/revista/README.md`). Unlike Hub worlds, it has no editorial workflow
or database: it is projected by a leader in class, and its text comes from the
printed teacher's edition. Status (`bloqueada`/`liberada`/`hoje`/`concluida`)
is derived from `liberarEm` and the Sunday date in America/Sao_Paulo.

Access: leaders and admins always; students only with an active learning
enrollment. The teacher's script (`professor`) is stripped on the server for
students. Scores are per team (Sal/Luz), never individual, and live only in the
projector device's localStorage; the self-assessment (raio-x) is never stored.
No student data is collected. Licensed magazine content stays behind login.

EBD indicators: the dashboard links each lesson to the completed EBD recorded
on the same Sunday (lessons ministered, attendance rate and average present
for those Sundays), and an EBD roll call shows that day's lesson. This is
context only: `summarizeEbd` stays the single attendance formula and the
pastoral radar is unchanged. Team scores are not shown there because they
are device-local.

## ADR-014 — Rule-based weekly actions for leaders (2026-11-15)

The dashboard card "Ações da semana" turns existing indicators into suggested
actions without AI or external automation. Pure rules in
`src/services/leader-actions.ts` (thresholds in `LEADER_ACTION_RULES`, texts in
`LEADER_ACTION_CATALOG`) cover the three radar levels, pending roll calls
(including EBDs), a drop of 15+ p.p. of the last EBD against the previous four
(only with 5+ considered records), recurring registered visitors and students
who returned after a streak. Radar suggestions are hidden for 7 days after any
non-cancelled follow-up; only follow-up dates are read, never their content.
There is no new table: recording a follow-up is the way to close an action.
No ranking of leaders or students, nothing shown to students, and the catalog
texts are pastoral copy subject to leadership review. The radar and
`summarizeEbd` remain the single sources of their rules.

## ADR-015 — Rescue for students who missed a Revista class (2026-11-15)

A student who missed a lesson (justified or not) may study it at home during
the 7 days after its Sunday; the trail invites them to do so. Proof is oral and
in person: on the next Sunday the teacher asks two or three questions and, on a
pass, grants +10 (`RESGATE`) to the team the student plays for that day, capped
at +30 per team per class so the class in person always counts more and
absences are never rewarded. The teacher grants and undoes it in Modo Professor.
This keeps ADR-013: no student data and no fixed teams are stored; only team
totals live on the projector device. It does not change attendance, the radar
or `summarizeEbd`. An online, server-graded proof remains a later option and
would first require keeping the quiz answer key off students' devices.
