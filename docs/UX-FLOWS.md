# UX flows

## Leader

Login → dashboard summary → EBD trend / last EBD composition / pastoral radar → care queue → event participation summary and operational agenda. Students → search/filter → create/edit/archive. Events → choose event type and one of three data-minimized modes → save a full roster, identified participation, or aggregate headcount. EBD always uses a full roster.

The staff dashboard shows birthdays in the current month and the next 30 days so leaders can prepare an appropriate acknowledgment. It also shows active adolescents aged 17 as **transitioning to youth** and those aged 18+ as **transition due**. These alerts never transfer or archive a person automatically.

Reports → choose a period of at most 366 days → generate a staff-only operational report → print or save as PDF → optionally open the device's email application with a privacy-safe aggregate summary and configured leader signatures. The user reviews the recipient and manually attaches the PDF. Pastoral follow-ups, guardian contacts and general notes are excluded.

An unplanned event that already happened uses **Register completed event**: type + date + aggregate adolescent/visitor count are saved atomically on one screen. Existing events expose **Edit event**; once participation exists, type and participation mode are locked while title, date, time and description remain editable.

The student profile keeps EBD metrics separate and shows actual participation in other event categories on a chronological timeline.

## Student

Login → “Olá, nome” → own EBD participation, recent Sundays, upcoming events and basic profile → **Conhecimento** for the governed learning catalog.

After functional approval of the first module, every authenticated role can open **Conhecimento** and view the approved module overview. Lessons remain visibly in preparation and cannot record progress until their full text, media, questions and technical data model pass final review.

## Admin

Administration → search/filter ministry memberships → change role or access state → confirm access-removing changes → receive an explicit result. The page also exposes a ministry-scoped recent audit trail. The last active administrator cannot be demoted or deactivated.

Every collection provides loading, empty and error states. Mobile uses stacked cards and minimum 44px controls; desktop progressively adds columns.

## Help guide

Every authenticated role can open **Ajuda** from the main navigation. The guide identifies the current access level and explains, in plain Portuguese with examples, the permitted workflows, event counting modes, EBD attendance, indicators, archiving, access deactivation, controlled invitations, privacy, and common access problems. It does not expose pastoral data or broaden any permission.

## Invitation acceptance

Authorized invitation → server-side token verification → authenticated password form → role-appropriate landing page. Passwords require at least 12 characters with upper- and lower-case letters and a number. Public sign-up remains disabled.

Password recovery starts in the same browser that will open the email link so the PKCE verifier remains available: Login → Forgot password → request link → open the newest email on the same device/browser → define password. The response does not disclose whether arbitrary email addresses exist.
