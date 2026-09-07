# UX flows

## Leader

Login → dashboard summary → EBD trend / last EBD composition / pastoral radar → care queue → event participation summary and operational agenda. Students → search/filter → create/edit/archive. Events → choose event type and one of three data-minimized modes → save a full roster, identified participation, or aggregate headcount. EBD always uses a full roster.

The student profile keeps EBD metrics separate and shows actual participation in other event categories on a chronological timeline.

## Student

Login → “Olá, nome” → own EBD participation, recent Sundays, upcoming events and basic profile. “Minha Jornada” is an explicitly future empty state.

## Admin

Administration → search/filter ministry memberships → change role or access state → confirm access-removing changes → receive an explicit result. The page also exposes a ministry-scoped recent audit trail. The last active administrator cannot be demoted or deactivated.

Every collection provides loading, empty and error states. Mobile uses stacked cards and minimum 44px controls; desktop progressively adds columns.

## Help guide

Every authenticated role can open **Ajuda** from the main navigation. The guide identifies the current access level and explains, in plain Portuguese with examples, the permitted workflows, event counting modes, EBD attendance, indicators, archiving, access deactivation, controlled invitations, privacy, and common access problems. It does not expose pastoral data or broaden any permission.

## Invitation acceptance

Authorized invitation → server-side token verification → authenticated password form → role-appropriate landing page. Passwords require at least 12 characters with upper- and lower-case letters and a number. Public sign-up remains disabled.
