# Architecture decisions

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

The operational adolescent range follows the Editora Betel curriculum: ages 12–17. Age 17 is labeled **transitioning** and age 18+ **transition due**. These values are derived from the authorized birth date using the ministry's São Paulo reference date; they do not mutate or archive records. The leadership decides the actual handoff date and preserves history. Birthday reminders are staff-only, have no ranking or spiritual meaning, and use no additional personal data.
