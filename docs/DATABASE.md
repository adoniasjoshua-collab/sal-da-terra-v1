# Database

The initial migration creates: `churches`, `ministries`, `profiles`, `ministry_members`, `students`, `events`, `attendance`, `pastoral_followups`, and `audit_logs`.

UUID primary keys, foreign keys, check/enum constraints, indexes and UTC timestamps are used. Student deletion is archival (`status = archived`, `is_active = false`, `archived_at`); related history is protected by restrictive foreign keys. Attendance uniqueness is `(event_id, student_id)`, and a constraint trigger rejects cross-ministry relationships.

Analytics are derived from completed/published EBD events. `justified` is reported separately and breaks a consecutive ordinary-absence streak; this rule is centralized in `src/services/attendance.ts`.

Events use a controlled taxonomy (`EBD`, worship, evangelism, volunteer action, rehearsal, meeting, congress, retreat and outing) and an `attendance_mode`. `full_roster` records presence/absence for expected members; `participation_only` uses `not_participated` as a neutral state. Neutral records are excluded from attendance metrics and are not pastoral alerts.
