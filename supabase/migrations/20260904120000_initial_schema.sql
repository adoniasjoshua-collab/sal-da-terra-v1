begin;

create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('student', 'leader', 'admin');
create type public.student_status as enum ('active', 'inactive', 'visitor', 'archived');
create type public.event_type as enum ('EBD', 'worship', 'evangelism', 'rehearsal', 'outing', 'congress', 'meeting', 'volunteer_action', 'retreat');
create type public.event_status as enum ('planned', 'open', 'completed', 'cancelled');
create type public.attendance_status as enum ('present', 'absent', 'justified', 'visitor', 'not_participated');
create type public.followup_type as enum ('conversation', 'phone_call', 'whatsapp', 'family_contact', 'visit', 'prayer', 'other');
create type public.followup_status as enum ('open', 'completed', 'cancelled');

create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.ministries (
  id uuid primary key default gen_random_uuid(), church_id uuid not null references public.churches(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 160), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (church_id, name)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 160), avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.ministry_members (
  id uuid primary key default gen_random_uuid(), ministry_id uuid not null references public.ministries(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict, role public.member_role not null,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (ministry_id, profile_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(), ministry_id uuid not null references public.ministries(id) on delete restrict,
  auth_user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 160), preferred_name text,
  birth_date date not null check (birth_date <= current_date), gender text, phone text,
  guardian_name text not null check (char_length(guardian_name) between 2 and 160), guardian_phone text not null,
  guardian_relationship text not null, joined_at date not null default current_date, notes text,
  status public.student_status not null default 'active', is_active boolean not null default true, archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((status = 'archived' and not is_active and archived_at is not null) or status <> 'archived')
);

create table public.events (
  id uuid primary key default gen_random_uuid(), ministry_id uuid not null references public.ministries(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160), type public.event_type not null default 'EBD',
  event_date date not null, start_time time, description text, status public.event_status not null default 'planned',
  attendance_mode text not null default 'full_roster' check (attendance_mode in ('full_roster', 'participation_only')),
  constraint events_ebd_full_roster_check check (type <> 'EBD' or attendance_mode = 'full_roster'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(), ministry_id uuid not null references public.ministries(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict, student_id uuid not null references public.students(id) on delete restrict,
  attendance_status public.attendance_status not null, registered_by uuid references public.profiles(id) on delete set null,
  notes text check (notes is null or char_length(notes) <= 500), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (event_id, student_id)
);

create table public.pastoral_followups (
  id uuid primary key default gen_random_uuid(), ministry_id uuid not null references public.ministries(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict, leader_id uuid not null references public.profiles(id) on delete restrict,
  followup_type public.followup_type not null, occurred_at timestamptz not null,
  summary text not null check (char_length(summary) between 2 and 2000), next_action text check (next_action is null or char_length(next_action) <= 500),
  next_action_date date, status public.followup_status not null default 'open', is_sensitive boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), ministry_id uuid references public.ministries(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text not null,
  entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index ministry_members_profile_idx on public.ministry_members(profile_id, ministry_id) where is_active;
create index students_ministry_status_idx on public.students(ministry_id, status) where is_active;
create index students_ministry_name_idx on public.students(ministry_id, lower(full_name));
create index events_ministry_date_idx on public.events(ministry_id, event_date desc);
create index attendance_student_idx on public.attendance(student_id, event_id);
create index attendance_ministry_idx on public.attendance(ministry_id, event_id);
create index followups_student_date_idx on public.pastoral_followups(student_id, occurred_at desc);
create index audit_ministry_date_idx on public.audit_logs(ministry_id, created_at desc);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create trigger churches_updated before update on public.churches for each row execute function public.set_updated_at();
create trigger ministries_updated before update on public.ministries for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger members_updated before update on public.ministry_members for each row execute function public.set_updated_at();
create trigger students_updated before update on public.students for each row execute function public.set_updated_at();
create trigger events_updated before update on public.events for each row execute function public.set_updated_at();
create trigger attendance_updated before update on public.attendance for each row execute function public.set_updated_at();
create trigger followups_updated before update on public.pastoral_followups for each row execute function public.set_updated_at();

create function public.has_ministry_role(target_ministry uuid, allowed_roles public.member_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ministry_members mm where mm.ministry_id = target_ministry and mm.profile_id = auth.uid() and mm.is_active and mm.role = any(allowed_roles));
$$;
create function public.is_own_ministry(target_ministry uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ministry_members mm where mm.ministry_id = target_ministry and mm.profile_id = auth.uid() and mm.is_active);
$$;
revoke all on function public.has_ministry_role(uuid, public.member_role[]) from public;
revoke all on function public.is_own_ministry(uuid) from public;
grant execute on function public.has_ministry_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.is_own_ministry(uuid) to authenticated;

create function public.validate_student_scope() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.auth_user_id is not null and not exists (
    select 1 from public.ministry_members mm where mm.profile_id = new.auth_user_id and mm.ministry_id = new.ministry_id and mm.role = 'student' and mm.is_active
  ) then raise exception 'student auth identity must have an active student membership in the same ministry'; end if;
  return new;
end; $$;
create function public.validate_attendance_scope() returns trigger language plpgsql set search_path = '' as $$
declare event_mode text;
begin
  select e.attendance_mode into event_mode
  from public.events e
  where e.id = new.event_id and e.ministry_id = new.ministry_id;
  if event_mode is null or not exists (
    select 1 from public.students s where s.id = new.student_id and s.ministry_id = new.ministry_id
  ) then raise exception 'attendance relationships must share ministry'; end if;
  if event_mode = 'full_roster' and new.attendance_status = 'not_participated'
  then raise exception 'full roster events require an attendance outcome'; end if;
  if event_mode = 'participation_only' and new.attendance_status in ('absent', 'justified')
  then raise exception 'optional events do not record absence outcomes'; end if;
  return new;
end; $$;
create function public.validate_followup_scope() returns trigger language plpgsql set search_path = '' as $$
begin
  if (
    not exists (select 1 from public.students s where s.id = new.student_id and s.ministry_id = new.ministry_id) or
    not exists (select 1 from public.ministry_members mm where mm.profile_id = new.leader_id and mm.ministry_id = new.ministry_id and mm.role in ('leader','admin') and mm.is_active)
  ) then raise exception 'follow-up relationships must share ministry and authorized leader'; end if;
  return new;
end; $$;
create trigger student_scope before insert or update on public.students for each row execute function public.validate_student_scope();
create trigger attendance_scope before insert or update on public.attendance for each row execute function public.validate_attendance_scope();
create trigger followup_scope before insert or update on public.pastoral_followups for each row execute function public.validate_followup_scope();

create function public.preserve_creation_actor() returns trigger language plpgsql set search_path = '' as $$
begin new.created_by = old.created_by; return new; end; $$;
create trigger students_creator_immutable before update on public.students for each row execute function public.preserve_creation_actor();
create trigger events_creator_immutable before update on public.events for each row execute function public.preserve_creation_actor();

create function public.audit_administrative_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare ministry uuid; entity uuid; verb text;
begin
  ministry := new.ministry_id; entity := new.id;
  verb := lower(tg_op) || '_' || tg_table_name;
  if tg_table_name = 'students' and tg_op = 'UPDATE'
    and to_jsonb(new) ->> 'status' = 'archived'
    and to_jsonb(old) ->> 'status' <> 'archived'
  then verb := 'archive_student'; end if;
  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
  values (ministry, auth.uid(), verb, tg_table_name, entity, jsonb_build_object('operation', tg_op));
  return new;
end; $$;
create trigger audit_students after insert or update on public.students for each row execute function public.audit_administrative_change();
create trigger audit_attendance after update on public.attendance for each row execute function public.audit_administrative_change();
create trigger audit_members after update on public.ministry_members for each row execute function public.audit_administrative_change();

alter table public.churches enable row level security;
alter table public.ministries enable row level security;
alter table public.profiles enable row level security;
alter table public.ministry_members enable row level security;
alter table public.students enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.pastoral_followups enable row level security;
alter table public.audit_logs enable row level security;

create policy churches_select on public.churches for select to authenticated using (exists (select 1 from public.ministries m where m.church_id = id and public.is_own_ministry(m.id)));
create policy ministries_select on public.ministries for select to authenticated using (public.is_own_ministry(id));
create policy profiles_own_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_admin_select on public.profiles for select to authenticated using (exists (
  select 1 from public.ministry_members mm where mm.profile_id = profiles.id and public.has_ministry_role(mm.ministry_id, array['admin']::public.member_role[])
));
create policy profiles_own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy members_select on public.ministry_members for select to authenticated using (profile_id = auth.uid() or public.has_ministry_role(ministry_id, array['admin']::public.member_role[]));
create policy members_admin_insert on public.ministry_members for insert to authenticated with check (public.has_ministry_role(ministry_id, array['admin']::public.member_role[]));
create policy members_admin_update on public.ministry_members for update to authenticated using (public.has_ministry_role(ministry_id, array['admin']::public.member_role[])) with check (public.has_ministry_role(ministry_id, array['admin']::public.member_role[]));

create policy students_staff_select on public.students for select to authenticated using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));
create policy students_staff_insert on public.students for insert to authenticated with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]) and created_by = auth.uid());
create policy students_staff_update on public.students for update to authenticated using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[])) with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));

create policy events_member_select on public.events for select to authenticated using (public.is_own_ministry(ministry_id));
create policy events_staff_insert on public.events for insert to authenticated with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]) and created_by = auth.uid());
create policy events_staff_update on public.events for update to authenticated using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[])) with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));

create policy attendance_staff_select on public.attendance for select to authenticated using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));
create policy attendance_staff_insert on public.attendance for insert to authenticated with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]) and registered_by = auth.uid());
create policy attendance_staff_update on public.attendance for update to authenticated using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[])) with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]) and registered_by = auth.uid());

create policy followups_staff_select on public.pastoral_followups for select to authenticated using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));
create policy followups_staff_insert on public.pastoral_followups for insert to authenticated with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]) and leader_id = auth.uid());
create policy followups_staff_update on public.pastoral_followups for update to authenticated using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[])) with check (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));
create policy audit_admin_select on public.audit_logs for select to authenticated using (public.has_ministry_role(ministry_id, array['admin']::public.member_role[]));

create function public.get_my_student_profile()
returns table (id uuid, ministry_id uuid, full_name text, preferred_name text, birth_date date, joined_at date, status public.student_status)
language sql stable security definer set search_path = '' as $$
  select s.id, s.ministry_id, s.full_name, s.preferred_name, s.birth_date, s.joined_at, s.status
  from public.students s
  where s.auth_user_id = auth.uid()
    and s.is_active
    and exists (
      select 1
      from public.ministry_members mm
      where mm.profile_id = auth.uid()
        and mm.ministry_id = s.ministry_id
        and mm.role = 'student'
        and mm.is_active
    );
$$;
create function public.get_my_attendance()
returns table (event_id uuid, event_date date, title text, attendance_status public.attendance_status)
language sql stable security definer set search_path = '' as $$
  select a.event_id, e.event_date, e.title, a.attendance_status from public.attendance a
  join public.students s on s.id = a.student_id join public.events e on e.id = a.event_id
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
revoke all on function public.get_my_student_profile() from public;
revoke all on function public.get_my_attendance() from public;
grant execute on function public.get_my_student_profile() to authenticated;
grant execute on function public.get_my_attendance() to authenticated;

-- RLS policies are evaluated only after PostgreSQL table privileges allow the
-- requested operation. Keep these grants minimal: the application has no hard
-- deletes, audit writes are trigger-only, and tenant isolation remains in RLS.
grant usage on schema public to authenticated;
grant select on table
  public.churches,
  public.ministries,
  public.profiles,
  public.ministry_members,
  public.students,
  public.events,
  public.attendance,
  public.pastoral_followups,
  public.audit_logs
to authenticated;
grant insert, update on table
  public.ministry_members,
  public.students,
  public.events,
  public.attendance,
  public.pastoral_followups
to authenticated;
grant update on table public.profiles to authenticated;
revoke truncate, references, trigger on table
  public.churches,
  public.ministries,
  public.profiles,
  public.ministry_members,
  public.students,
  public.events,
  public.attendance,
  public.pastoral_followups,
  public.audit_logs
from authenticated;

commit;
