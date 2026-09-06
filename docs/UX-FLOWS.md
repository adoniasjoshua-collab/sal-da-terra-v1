# UX flows

## Leader

Login → dashboard → attention queue / last EBD → student profile or follow-up. Students → search/filter → create/edit/archive. Events → choose event type and participation mode → one-handed roster → save one upsert batch. EBD uses a full roll call; optional events default to neutral non-participation.

The student profile keeps EBD metrics separate and shows actual participation in other event categories on a chronological timeline.

## Student

Login → “Olá, nome” → own EBD participation, recent Sundays, upcoming events and basic profile. “Minha Jornada” is an explicitly future empty state.

## Admin

Administration → search/filter ministry memberships → change role or access state → confirm access-removing changes → receive an explicit result. The page also exposes a ministry-scoped recent audit trail. The last active administrator cannot be demoted or deactivated.

Every collection provides loading, empty and error states. Mobile uses stacked cards and minimum 44px controls; desktop progressively adds columns.
