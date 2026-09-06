begin;

drop trigger if exists student_scope on public.students;
drop trigger if exists attendance_scope on public.attendance;
drop trigger if exists followup_scope on public.pastoral_followups;
drop function if exists public.validate_scoped_relationships();

create function public.validate_student_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.auth_user_id is not null and not exists (
    select 1
    from public.ministry_members mm
    where mm.profile_id = new.auth_user_id
      and mm.ministry_id = new.ministry_id
      and mm.role = 'student'
      and mm.is_active
  ) then
    raise exception 'student auth identity must have an active student membership in the same ministry';
  end if;
  return new;
end;
$$;

create function public.validate_attendance_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.events e
    where e.id = new.event_id and e.ministry_id = new.ministry_id
  ) or not exists (
    select 1 from public.students s
    where s.id = new.student_id and s.ministry_id = new.ministry_id
  ) then
    raise exception 'attendance relationships must share ministry';
  end if;
  return new;
end;
$$;

create function public.validate_followup_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.students s
    where s.id = new.student_id and s.ministry_id = new.ministry_id
  ) or not exists (
    select 1 from public.ministry_members mm
    where mm.profile_id = new.leader_id
      and mm.ministry_id = new.ministry_id
      and mm.role in ('leader', 'admin')
      and mm.is_active
  ) then
    raise exception 'follow-up relationships must share ministry and authorized leader';
  end if;
  return new;
end;
$$;

create trigger student_scope
before insert or update on public.students
for each row execute function public.validate_student_scope();

create trigger attendance_scope
before insert or update on public.attendance
for each row execute function public.validate_attendance_scope();

create trigger followup_scope
before insert or update on public.pastoral_followups
for each row execute function public.validate_followup_scope();

create or replace function public.audit_administrative_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ministry uuid;
  entity uuid;
  verb text;
begin
  ministry := new.ministry_id;
  entity := new.id;
  verb := lower(tg_op) || '_' || tg_table_name;

  if tg_table_name = 'students'
    and tg_op = 'UPDATE'
    and to_jsonb(new) ->> 'status' = 'archived'
    and to_jsonb(old) ->> 'status' <> 'archived'
  then
    verb := 'archive_student';
  end if;

  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
  values (ministry, auth.uid(), verb, tg_table_name, entity, jsonb_build_object('operation', tg_op));
  return new;
end;
$$;

commit;
