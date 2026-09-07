begin;

-- One-time, private rollback snapshot created before removing demonstration
-- activity. This schema is not exposed by the Data API.
create schema if not exists private_transition_20260906;
revoke all on schema private_transition_20260906 from public, anon, authenticated;

create table private_transition_20260906.churches as table public.churches;
create table private_transition_20260906.ministries as table public.ministries;
create table private_transition_20260906.profiles as table public.profiles;
create table private_transition_20260906.ministry_members as table public.ministry_members;
create table private_transition_20260906.students as table public.students;
create table private_transition_20260906.events as table public.events;
create table private_transition_20260906.attendance as table public.attendance;
create table private_transition_20260906.event_headcounts as table public.event_headcounts;
create table private_transition_20260906.pastoral_followups as table public.pastoral_followups;
create table private_transition_20260906.audit_logs as table public.audit_logs;
create table private_transition_20260906.auth_accounts as
select id, email, email_confirmed_at, created_at
from auth.users;
revoke all on all tables in schema private_transition_20260906 from public, anon, authenticated;

insert into public.profiles (id, full_name)
values ('27bb211d-037b-4bff-98b0-e5b06683c0f1', 'Adonias Joshua')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.ministry_members (ministry_id, profile_id, role, is_active)
values (
  '20000000-0000-0000-0000-000000000001',
  '27bb211d-037b-4bff-98b0-e5b06683c0f1',
  'admin',
  true
)
on conflict (ministry_id, profile_id)
do update set role = 'admin', is_active = true;

update public.churches
set name = 'Igreja Pioneira', slug = 'igreja-pioneira'
where id = '10000000-0000-0000-0000-000000000001';

update public.ministries
set name = 'Madureira'
where id = '20000000-0000-0000-0000-000000000001';

-- Clear operational demonstration activity so official registration starts at
-- zero. Accounts are handled separately after the official invite is accepted.
delete from public.event_headcounts
where ministry_id = '20000000-0000-0000-0000-000000000001';
delete from public.attendance
where ministry_id = '20000000-0000-0000-0000-000000000001';
delete from public.pastoral_followups
where ministry_id = '20000000-0000-0000-0000-000000000001';
delete from public.events
where ministry_id = '20000000-0000-0000-0000-000000000001';
delete from public.students
where ministry_id = '20000000-0000-0000-0000-000000000001';
delete from public.audit_logs
where ministry_id = '20000000-0000-0000-0000-000000000001';

comment on schema private_transition_20260906 is
  'Restricted snapshot taken before the 2026-09-06 DEMO-to-official transition; review and remove after the agreed retention window.';

commit;
