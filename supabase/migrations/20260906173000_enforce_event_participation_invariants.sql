begin;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'events_ebd_full_roster_check'
  ) then
    alter table public.events
      add constraint events_ebd_full_roster_check
      check (type <> 'EBD' or attendance_mode = 'full_roster');
  end if;
end;
$$;

create or replace function public.validate_attendance_scope()
returns trigger language plpgsql set search_path = '' as $$
declare event_mode text;
begin
  select e.attendance_mode into event_mode
  from public.events e
  where e.id = new.event_id and e.ministry_id = new.ministry_id;

  if event_mode is null or not exists (
    select 1
    from public.students s
    where s.id = new.student_id and s.ministry_id = new.ministry_id
  ) then
    raise exception 'attendance relationships must share ministry';
  end if;

  if event_mode = 'full_roster' and new.attendance_status = 'not_participated' then
    raise exception 'full roster events require an attendance outcome';
  end if;

  if event_mode = 'participation_only' and new.attendance_status in ('absent', 'justified') then
    raise exception 'optional events do not record absence outcomes';
  end if;

  return new;
end;
$$;

commit;
