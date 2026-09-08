# Row Level Security

All application tables have RLS enabled. Small `security definer` helpers run with an empty explicit `search_path` and are executable only by authenticated users, avoiding recursive membership policies.

The `authenticated` role receives only the table privileges required by the V1 API. RLS then restricts which rows each user can access. No application table grants `DELETE`, `TRUNCATE`, `TRIGGER`, or `REFERENCES`; `audit_logs` is read-only through the API, while its writes are performed only by controlled database triggers.

| Actor | Read | Write |
|---|---|---|
| Student | own safe profile and attendance through restricted RPCs, only while the student membership is active; ministry/event basics needed for own experience | none |
| Leader | rows in memberships where role is leader/admin; active report signatories in the same ministry | students, events, attendance and follow-ups in same ministry |
| Admin | rows in admin memberships; report signatories in the same ministry | same scope plus memberships and report-signatory configuration; audit reads |

Aggregate event counts in `event_headcounts` are readable and writable only by leaders/admins in the same ministry. Students cannot query this table. Database triggers ensure the event and count share a ministry and that aggregate-only events cannot receive individual attendance rows.

Report signatories contain only authorized adult leader identity and work contact details. Leaders can read them for report generation; only admins can create or update them. Students cannot query the table, and application users cannot physically delete rows.

Administrative membership changes are audited by a database trigger. A separate database guard prevents demotion or deactivation of the last active administrator in a ministry, including mutations attempted outside the application UI.

Insert/update policies require both `USING` and `WITH CHECK`. Cross-ministry attendance/follow-up references are rejected by database triggers. Students have no direct policy on `students`, `attendance`, `pastoral_followups`, or `audit_logs`; the two safe RPCs return only approved columns and require an active `student` membership in the same ministry.

RLS tests in `supabase/tests/rls.sql` impersonate users and verify positive and negative access. They require the local Supabase stack; TypeScript unit tests are not a substitute.
