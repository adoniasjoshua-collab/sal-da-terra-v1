begin;

alter table public.events drop constraint if exists events_attendance_mode_check;
alter table public.events add constraint events_attendance_mode_check
  check (attendance_mode in ('full_roster', 'participation_only', 'headcount_only'));

create table public.event_headcounts (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid not null references public.ministries(id) on delete restrict,
  event_id uuid not null unique references public.events(id) on delete restrict,
  adolescent_count integer not null check (adolescent_count >= 0),
  visitor_count integer not null default 0 check (visitor_count >= 0 and visitor_count <= adolescent_count),
  is_estimated boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 500),
  registered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index event_headcounts_ministry_idx on public.event_headcounts(ministry_id, event_id);
create trigger event_headcounts_updated before update on public.event_headcounts
for each row execute function public.set_updated_at();

create function public.validate_event_headcount_scope()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.events e
    where e.id = new.event_id
      and e.ministry_id = new.ministry_id
      and e.attendance_mode = 'headcount_only'
  ) then
    raise exception 'headcount requires a headcount-only event in the same ministry';
  end if;
  return new;
end;
$$;

create trigger event_headcount_scope before insert or update on public.event_headcounts
for each row execute function public.validate_event_headcount_scope();

create or replace function public.validate_attendance_scope()
returns trigger language plpgsql set search_path = '' as $$
declare event_mode text;
begin
  select e.attendance_mode into event_mode
  from public.events e
  where e.id = new.event_id and e.ministry_id = new.ministry_id;

  if event_mode is null or not exists (
    select 1 from public.students s
    where s.id = new.student_id and s.ministry_id = new.ministry_id
  ) then
    raise exception 'attendance relationships must share ministry';
  end if;

  if event_mode = 'headcount_only' then
    raise exception 'headcount-only events do not accept individual attendance';
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

create function public.prevent_event_mode_change_with_records()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.attendance_mode <> new.attendance_mode and (
    exists (select 1 from public.attendance a where a.event_id = old.id) or
    exists (select 1 from public.event_headcounts h where h.event_id = old.id)
  ) then
    raise exception 'event participation mode cannot change after records exist';
  end if;
  return new;
end;
$$;

create trigger event_mode_immutable_with_records before update on public.events
for each row execute function public.prevent_event_mode_change_with_records();

create trigger audit_event_headcounts after insert or update on public.event_headcounts
for each row execute function public.audit_administrative_change();

alter table public.event_headcounts enable row level security;
create policy event_headcounts_staff_select on public.event_headcounts for select to authenticated
using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));
create policy event_headcounts_staff_insert on public.event_headcounts for insert to authenticated
with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]) and registered_by = auth.uid());
create policy event_headcounts_staff_update on public.event_headcounts for update to authenticated
using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]))
with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]) and registered_by = auth.uid());

grant select, insert, update on table public.event_headcounts to authenticated;
revoke delete, truncate, references, trigger on table public.event_headcounts from authenticated;

comment on table public.event_headcounts is 'Privacy-preserving aggregate count for events that do not require participant identities.';
comment on column public.event_headcounts.adolescent_count is 'Total adolescents present, including visitors.';
comment on column public.event_headcounts.visitor_count is 'Visitor subset of adolescent_count.';

commit;
