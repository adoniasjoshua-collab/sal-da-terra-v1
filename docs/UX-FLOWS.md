# UX flows

## Learning increment — world one

Knowledge → track map → published/enrolled world → four explicit readings →
scenario exercise → quiz with educational draft recovery and explained results →
summary → supervised practice or equivalent → adult validation → private badge.
Retries preserve earned progress and never multiply XP. Unpublished content and
unenrolled learners have explicit unavailable states, not working-looking buttons.

Knowledge → management lets administrators assign independent editorial actors;
the author submits, the assigned reviewer approves or returns with a reason, and
an administrator publishes. If the reviewer becomes unavailable, an administrator
can recall an in-review or approved version to draft with an audited reason,
discarding the approval. Administrators authorize enrollment; leaders/admins
review requested practices with a minimal educational justification. The panel
shows progress and decision history scoped to the ministry. Archived publication
and deactivated enrollment preserve history and block writes; learners who
completed an archived world can still reread it (without answer keys) read-only.

The old three-lesson preparation screen has been replaced by this governed catalog.
The world-one pilot still requires human review and deployment of its migrations.

## Leader

Login → dashboard summary → EBD trend / last EBD composition / pastoral radar → care queue → event participation summary and operational agenda. Students → search/filter → create/edit/archive. Events → choose event type and one of three data-minimized modes → save a full roster, identified participation, or aggregate headcount. EBD always uses a full roster.

The staff dashboard shows birthdays in the current month and the next 30 days so leaders can prepare an appropriate acknowledgment. It also shows active adolescents aged 15 as **transitioning to youth** and those aged 16+ as **transition due**. These alerts never transfer or archive a person automatically.

Reports → choose a period of at most 366 days → generate a staff-only operational report → print or save as PDF → optionally open the device's email application with a privacy-safe aggregate summary and configured leader signatures. The user reviews the recipient and manually attaches the PDF. Pastoral follow-ups, guardian contacts and general notes are excluded.

An unplanned event that already happened uses **Register completed event**: type + date + aggregate adolescent/visitor count are saved atomically on one screen. Existing events expose **Edit event**; once participation exists, type and participation mode are locked while title, date, time and description remain editable.

The student profile keeps EBD metrics separate and shows actual participation in other event categories on a chronological timeline.

## Student

Login → “Olá, nome” → own EBD participation, recent Sundays, upcoming events and basic profile → **Conhecimento** for the governed learning catalog.

After functional approval of the first module, every authenticated role can open **Conhecimento** and view the approved module overview. Lessons remain visibly in preparation and cannot record progress until their full text, media, questions and technical data model pass final review.

## Admin

Administration provides direct links to adolescent records, pastoral follow-ups, events, attendance, headcounts, memberships and report signatures. The adolescent list and profile expose **Edit registration and status**. Staff can correct all registration fields, including archived records, and choose active, inactive, visitor or archived; lifecycle fields are saved consistently. Archiving preserves history and can be reversed.

Existing event forms allow planned, open, completed or cancelled status. Cancelling preserves participation; reopen the event before editing its participation. Historical attendance remains editable for participants who subsequently became inactive or archived. Read errors block editing instead of replacing saved attendance with default absences or zero counts.

Each pastoral follow-up exposes an edit form for its content, dates, type, sensitivity and open/completed/cancelled status. Original authorship is preserved. Updates refresh operational pages and reports. Memberships and report signatories are removed from active use through deactivation; student deletion uses archival, and events/follow-ups use cancellation.

Administration → search/filter ministry memberships → change role or access state → confirm access-removing changes → receive an explicit result. The page also exposes a ministry-scoped recent audit trail. The last active administrator cannot be demoted or deactivated.

Every collection provides loading, empty and error states. Mobile uses stacked cards and minimum 44px controls; desktop progressively adds columns.

## Help guide

Every authenticated role can open **Ajuda** from the main navigation. The guide identifies the current access level and explains, in plain Portuguese with examples, the permitted workflows, event counting modes, EBD attendance, indicators, archiving, access deactivation, controlled invitations, privacy, and common access problems. It does not expose pastoral data or broaden any permission.

## Invitation acceptance

Administrators can also manage student invitations directly at the bottom of
**Editar cadastro e status**, using the same **Acesso do aluno ao portal** panel
as the profile. Leaders cannot view this panel or issue invitations.

Student access: Admin → adolescent profile → **Acesso do aluno ao portal** → e-mail
(adolescent or guardian) → server creates a new Auth identity, links profile,
`student` membership and `students.auth_user_id` → personal link shown once with
copy / WhatsApp (guardian phone or contact picker). The link opens `/convite`,
which has no side effects (WhatsApp previews and mail scanners prefetch URLs);
the one-time token is verified only on **Continuar**, then `/definir-senha`.
Students use 8+ characters with letters and a number; staff keep the strong rule.
**Gerar novo link** issues an invite (pending) or recovery (accepted) link.
Leaders: Administração → **Convidar líder ou revisor** (name + e-mail) → same
one-time link flow; the person joins as `leader` and can be assigned as module
reviewer. Admin promotion stays an explicit membership change. New links can be
reissued only for active leaders (never admins or oneself).
Administração → **Criar aluno de teste** creates a fictitious `is_test` record,
excluded from rosters, dashboard and reports, to rehearse the real flow.

Authorized invitation → server-side token verification → authenticated password form → role-appropriate landing page. Passwords require at least 12 characters with upper- and lower-case letters and a number. Public sign-up remains disabled.

Password recovery starts in the same browser that will open the email link so the PKCE verifier remains available: Login → Forgot password → request link → open the newest email on the same device/browser → define password. The response does not disclose whether arbitrary email addresses exist.
