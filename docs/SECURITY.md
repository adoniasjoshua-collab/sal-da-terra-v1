# Security and privacy

- PostgreSQL RLS is the final authorization boundary; route/layout checks improve UX only.
- Browser code receives only project URL and publishable key. A Supabase secret/service-role key is never used by this app.
- Authenticated pages are dynamic and session responses are not shared-cached.
- Server Actions are public endpoints: validate input, resolve the authenticated actor, and rely on RLS for tenant scope.
- Minimize minor data. No address, documents, location, social profile, direct messages, or public ranking.
- Prefer aggregate `event_headcounts` when participant identities are not required. Aggregate notes must never contain names or contact details; estimates are explicitly labeled.
- Students never receive guardian contact details, other students' data, follow-ups, audit logs, or administrative notes.
- Sensitive follow-up summaries are available only to authorized leaders/admins in the same ministry. Audit metadata must not copy pastoral content.

Production requires HTTPS, MFA for leaders/admins, restricted Supabase dashboard access, reviewed migrations, backups, retention policy, incident response, and applicable LGPD legal review/consent procedures.

Invitations use the Supabase verification link and an authenticated password-setting flow. Public sign-up remains disabled; an invited identity receives application access only after an authorized ministry membership exists. Invite and secret keys are never exposed to browser code.
