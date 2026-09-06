# Database

The initial schema plus versioned migrations provide: `churches`, `ministries`, `profiles`, `ministry_members`, `students`, `events`, `attendance`, `event_headcounts`, `pastoral_followups`, and `audit_logs`.

UUID primary keys, foreign keys, check/enum constraints, indexes and UTC timestamps are used. Student deletion is archival (`status = archived`, `is_active = false`, `archived_at`); related history is protected by restrictive foreign keys. Attendance uniqueness is `(event_id, student_id)`, and a constraint trigger rejects cross-ministry relationships.

Analytics are derived from completed/published EBD events. `justified` is reported separately and breaks a consecutive ordinary-absence streak; this rule is centralized in `src/services/attendance.ts`.

The leader dashboard uses an operational attendance rate of `present / (present + absent)`. Justified absences and visitors remain visible as separate volumes and do not reduce this rate. The recent comparison pools attendance records from the latest four completed EBD events and compares them with the preceding four.

Events use a controlled taxonomy (`EBD`, worship, evangelism, volunteer action, rehearsal, meeting, congress, retreat and outing) and an `attendance_mode`. `full_roster` records presence/absence for expected members; `participation_only` records identified participation and uses `not_participated` as a neutral state; `headcount_only` stores only an aggregate adolescent count in `event_headcounts`. Neutral records are excluded from attendance metrics and are not pastoral alerts.

For aggregate events, `adolescent_count` includes visitors and `visitor_count` is a subset. `is_estimated` distinguishes estimates from exact counts. Participation volume may combine named attendance with aggregate counts, but unique people are computed only from identified events and are always labeled accordingly.

Database constraints require every EBD to use `full_roster`. The attendance scope trigger rejects individual rows for `headcount_only`, rejects `not_participated` in a full roster, and rejects `absent`/`justified` in participation-only events. Event mode cannot change after participation records exist.
