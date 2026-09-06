begin;

alter type public.event_type add value if not exists 'volunteer_action';
alter type public.event_type add value if not exists 'retreat';
alter type public.attendance_status add value if not exists 'not_participated';

alter table public.events
  add column if not exists attendance_mode text not null default 'full_roster'
  check (attendance_mode in ('full_roster', 'participation_only'));

-- The existing student RPC powers EBD-specific metrics. Other observable
-- participation is exposed separately in the authorized leader timeline.
create or replace function public.get_my_attendance()
returns table (event_id uuid, event_date date, title text, attendance_status public.attendance_status)
language sql stable security definer set search_path = '' as $$
  select a.event_id, e.event_date, e.title, a.attendance_status
  from public.attendance a
  join public.students s on s.id = a.student_id
  join public.events e on e.id = a.event_id
  where s.auth_user_id = auth.uid()
    and s.is_active
    and a.ministry_id = s.ministry_id
    and e.type = 'EBD'
    and exists (
      select 1
      from public.ministry_members mm
      where mm.profile_id = auth.uid()
        and mm.ministry_id = s.ministry_id
        and mm.role = 'student'
        and mm.is_active
    )
  order by e.event_date desc;
$$;

commit;
