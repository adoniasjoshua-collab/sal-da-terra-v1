begin;

-- Existing identity links remain historical facts after an access is disabled.
-- Validate membership when assigning a link, not when correcting unrelated data.
create or replace function public.validate_student_scope()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.auth_user_id is not distinct from old.auth_user_id
      and new.ministry_id = old.ministry_id then
      return new;
    end if;
  end if;
  if new.auth_user_id is not null and not exists (
    select 1 from public.ministry_members mm
    where mm.profile_id = new.auth_user_id and mm.ministry_id = new.ministry_id
      and mm.role = 'student' and mm.is_active
  ) then
    raise exception 'student auth identity must have an active student membership in the same ministry';
  end if;
  return new;
end;
$$;

create or replace function public.validate_followup_scope()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.students s
    where s.id = new.student_id and s.ministry_id = new.ministry_id
  ) then
    raise exception 'follow-up relationships must share ministry and authorized leader';
  end if;
  if tg_op = 'UPDATE' then
    if new.leader_id is not distinct from old.leader_id
      and new.ministry_id = old.ministry_id then
      return new;
    end if;
  end if;
  if not exists (
    select 1 from public.ministry_members mm
    where mm.profile_id = new.leader_id and mm.ministry_id = new.ministry_id
      and mm.role in ('leader', 'admin') and mm.is_active
  ) then
    raise exception 'follow-up relationships must share ministry and authorized leader';
  end if;
  return new;
end;
$$;

-- Audit contains identifiers and operation only, never pastoral content.
drop trigger if exists audit_followups on public.pastoral_followups;
create trigger audit_followups after insert or update on public.pastoral_followups
for each row execute function public.audit_administrative_change();

commit;
