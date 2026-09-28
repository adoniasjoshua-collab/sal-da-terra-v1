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
Ministry publications assign distinct adult author/reviewer identities and enforce
editorial transitions. Admins authorize student enrollment after publication.
Completion, quiz scoring, practical review and XP are written atomically by
`learning_command`; `learning_snapshot` returns a role-scoped projection.
Base tables have RLS enabled and no API grants/policies. Neither answer keys nor
adult review notes are included in the learner projection.

The first adapter intentionally serves world one version 1; expanding worlds or
versions requires extending the adapter while preserving existing enrollments.
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
