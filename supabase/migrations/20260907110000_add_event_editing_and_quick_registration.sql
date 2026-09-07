begin;

create or replace function public.prevent_event_mode_change_with_records()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (old.attendance_mode <> new.attendance_mode or old.type <> new.type) and (
    exists (select 1 from public.attendance a where a.event_id = old.id) or
    exists (select 1 from public.event_headcounts h where h.event_id = old.id)
  ) then
    raise exception 'event type and participation mode cannot change after records exist';
  end if;
  return new;
end;
$$;

drop trigger if exists audit_events on public.events;
create trigger audit_events after insert or update on public.events
for each row execute function public.audit_administrative_change();

create function public.register_completed_headcount_event(
  target_ministry uuid,
  event_title text,
  event_kind public.event_type,
  occurred_on date,
  began_at time,
  event_description text,
  total_adolescents integer,
  total_visitors integer,
  count_is_estimated boolean,
  count_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_event_id uuid;
begin
  if event_kind = 'EBD' then raise exception 'EBD requires a full roster'; end if;
  if char_length(trim(event_title)) not between 2 and 160 then raise exception 'invalid event title'; end if;
  if total_adolescents < 0 or total_visitors < 0 or total_visitors > total_adolescents then raise exception 'invalid participant counts'; end if;
  if event_description is not null and char_length(event_description) > 1000 then raise exception 'event description is too long'; end if;
  if count_notes is not null and char_length(count_notes) > 500 then raise exception 'count notes are too long'; end if;
  if not public.has_ministry_role(target_ministry, array['leader','admin']::public.member_role[]) then raise exception 'access denied'; end if;

  insert into public.events (ministry_id, title, type, event_date, start_time, description, status, attendance_mode, created_by)
  values (target_ministry, trim(event_title), event_kind, occurred_on, began_at, nullif(trim(event_description), ''), 'completed', 'headcount_only', auth.uid())
  returning id into new_event_id;

  insert into public.event_headcounts (ministry_id, event_id, adolescent_count, visitor_count, is_estimated, notes, registered_by)
  values (target_ministry, new_event_id, total_adolescents, total_visitors, count_is_estimated, nullif(trim(count_notes), ''), auth.uid());

  return new_event_id;
end;
$$;

revoke all on function public.register_completed_headcount_event(uuid,text,public.event_type,date,time,text,integer,integer,boolean,text) from public;
grant execute on function public.register_completed_headcount_event(uuid,text,public.event_type,date,time,text,integer,integer,boolean,text) to authenticated;

comment on function public.register_completed_headcount_event(uuid,text,public.event_type,date,time,text,integer,integer,boolean,text) is
  'Atomically registers a completed non-EBD event and its privacy-preserving aggregate participant count for authorized ministry staff.';

commit;
