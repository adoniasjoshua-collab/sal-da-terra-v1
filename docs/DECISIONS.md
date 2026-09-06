# Architecture decisions

## ADR-001 — Tenant membership table

Roles belong to a ministry membership, not a global JWT claim. This allows one account to have different authorized roles in different ministries.

## ADR-002 — Database-enforced authorization

RLS and relationship triggers enforce scope. Server UI checks cannot replace them.

## ADR-003 — Transparent operational radar

Radar is derived from consecutive ordinary EBD absences: 0–1 active, 2 attention, 3 follow-up, 4+ priority. Justified absences do not count as ordinary absence. It is not a spiritual evaluation.

## ADR-004 — No service role in web runtime

All application queries use the caller's publishable-key session. Privileged lifecycle operations belong in separately reviewed admin infrastructure.
