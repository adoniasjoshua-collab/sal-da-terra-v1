begin;

-- Quick access (ADR-012): adolescents without e-mail sign in with a username
-- and a random temporary code issued by an administrator. The Auth identity
-- uses an internal, never-delivered address derived from the username.
-- The code is valid for 7 days and must be replaced by the student's own
-- password at the first sign-in. Expired codes are invalidated in Auth itself,
-- so they cannot be used even outside the application's login screen.
create table public.student_quick_access (
  student_id uuid primary key references public.students(id) on delete restrict,
  ministry_id uuid not null references public.ministries(id) on delete restrict,
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  username text not null unique check (username ~ '^[a-z0-9]+(\.[a-z0-9]+)*$' and char_length(username) between 3 and 40),
  -- Null once the student replaced the code with a personal password.
  code_expires_at timestamptz,
  code_revoked_at timestamptz,
  -- Hash written for the current code; never exposed to API roles.
  code_hash text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger student_quick_access_updated before update on public.student_quick_access
  for each row execute function public.set_updated_at();
alter table public.student_quick_access enable row level security;
-- Reads go through column-limited grants; writes only through the RPCs below.
revoke all on public.student_quick_access from public, anon, authenticated;
grant select (student_id, ministry_id, profile_id, username, code_expires_at, code_revoked_at, created_at)
  on public.student_quick_access to authenticated;
create policy student_quick_access_admin_select on public.student_quick_access for select to authenticated
  using (public.has_ministry_role(ministry_id, array['admin']::public.member_role[]));

-- Writes a temporary code as the identity's password. Internal helper.
create function public.write_student_access_code(target_profile uuid, code text)
returns text language plpgsql security definer set search_path = '' as $$
declare hashed text := extensions.crypt(code, extensions.gen_salt('bf', 10));
begin
  update auth.users set encrypted_password = hashed, updated_at = now() where id = target_profile;
  if not found then raise exception 'student_access_identity'; end if;
  return hashed;
end; $$;
revoke all on function public.write_student_access_code(uuid, text) from public, anon, authenticated;

create function public.validate_student_access_code(code text) returns void language plpgsql immutable set search_path = '' as $$
begin
  if code is null or char_length(code) not between 10 and 64 or code !~ '[0-9]' or code !~ '[a-z]' then
    raise exception 'student_access_code_invalid';
  end if;
end; $$;
revoke all on function public.validate_student_access_code(text) from public, anon, authenticated;

-- Links a brand-new Auth identity created without e-mail delivery and sets its
-- first temporary code. Reuses provision_student_access for every identity check.
create function public.provision_student_quick_access(target_student uuid, target_profile uuid, target_username text, code text)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare s public.students; expires timestamptz := now() + interval '7 days';
begin
  perform public.validate_student_access_code(code);
  if target_username is null or target_username !~ '^[a-z0-9]+(\.[a-z0-9]+)*$' or char_length(target_username) not between 3 and 40 then
    raise exception 'student_username_invalid';
  end if;
  if exists (select 1 from public.student_quick_access q where q.username = target_username) then
    raise exception 'student_username_taken';
  end if;
  perform public.provision_student_access(target_student, target_profile);
  select * into s from public.students where id = target_student;
  insert into public.student_quick_access(student_id, ministry_id, profile_id, username, code_expires_at, code_hash, created_by)
    values (s.id, s.ministry_id, target_profile, target_username, expires, public.write_student_access_code(target_profile, code), auth.uid());
  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
    values (s.ministry_id, auth.uid(), 'issue_student_access_code', 'students', s.id, jsonb_build_object('is_test', s.is_test, 'first', true));
  return expires;
end; $$;

-- Issues a new 7-day code (forgotten password or expired code). Admin only,
-- active access only; the student must create a new password at sign-in.
create function public.issue_student_access_code(target_student uuid, code text)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare s public.students; q public.student_quick_access; expires timestamptz := now() + interval '7 days';
begin
  select * into s from public.students where id = target_student;
  if not found or not public.has_ministry_role(s.ministry_id, array['admin']::public.member_role[]) then
    raise exception 'student_access_denied';
  end if;
  select * into q from public.student_quick_access where student_id = s.id for update;
  if not found or s.auth_user_id is distinct from q.profile_id then raise exception 'student_access_missing'; end if;
  if not s.is_active or s.status = 'archived' or not exists (select 1 from public.ministry_members mm
    where mm.ministry_id = s.ministry_id and mm.profile_id = q.profile_id and mm.role = 'student' and mm.is_active) then
    raise exception 'student_access_inactive';
  end if;
  perform public.validate_student_access_code(code);
  update public.student_quick_access set code_expires_at = expires, code_revoked_at = null,
    code_hash = public.write_student_access_code(q.profile_id, code) where student_id = s.id;
  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
    values (s.ministry_id, auth.uid(), 'issue_student_access_code', 'students', s.id, jsonb_build_object('is_test', s.is_test, 'first', false));
  return expires;
end; $$;

-- Replaces every expired, still pending code with an unknown random password.
-- Idempotent and parameterless, so it is safe to call before any sign-in.
create function public.expire_student_access_codes()
returns void language plpgsql security definer set search_path = '' as $$
declare q record;
begin
  for q in select student_id, profile_id from public.student_quick_access
    where code_expires_at is not null and code_expires_at <= now() and code_revoked_at is null for update
  loop
    update public.student_quick_access set code_revoked_at = now(),
      code_hash = public.write_student_access_code(q.profile_id, encode(extensions.gen_random_bytes(32), 'hex'))
      where student_id = q.student_id;
  end loop;
end; $$;

-- 'none' (personal password or e-mail account), 'active' or 'expired'.
create function public.my_access_code_state()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select case
    when q.code_expires_at is null then 'none'
    when q.code_revoked_at is not null or q.code_expires_at <= now() then 'expired'
    else 'active' end
    from public.student_quick_access q where q.profile_id = auth.uid()), 'none');
$$;

-- Ends the temporary-code phase only after the student really set a personal
-- password: the given password must be the current one and must not be the code.
create function public.complete_student_access_code(new_password text)
returns void language plpgsql security definer set search_path = '' as $$
declare q public.student_quick_access; current_hash text;
begin
  select * into q from public.student_quick_access where profile_id = auth.uid() for update;
  if not found or q.code_expires_at is null then return; end if;
  select u.encrypted_password into current_hash from auth.users u where u.id = auth.uid();
  if current_hash is null or current_hash = q.code_hash
    or extensions.crypt(new_password, current_hash) <> current_hash
    or extensions.crypt(new_password, q.code_hash) = q.code_hash then
    raise exception 'student_access_code_unchanged';
  end if;
  update public.student_quick_access set code_expires_at = null, code_revoked_at = null, code_hash = null
    where student_id = q.student_id;
end; $$;

revoke all on function public.provision_student_quick_access(uuid, uuid, text, text) from public, anon;
revoke all on function public.issue_student_access_code(uuid, text) from public, anon;
revoke all on function public.expire_student_access_codes() from public;
revoke all on function public.my_access_code_state() from public, anon;
revoke all on function public.complete_student_access_code(text) from public, anon;
grant execute on function public.provision_student_quick_access(uuid, uuid, text, text) to authenticated;
grant execute on function public.issue_student_access_code(uuid, text) to authenticated;
grant execute on function public.expire_student_access_codes() to anon, authenticated;
grant execute on function public.my_access_code_state() to authenticated;
grant execute on function public.complete_student_access_code(text) to authenticated;

-- Periodic invalidation where pg_cron is available (Supabase). The application
-- also runs it before every sign-in, so environments without pg_cron stay safe
-- for codes used through the portal.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      execute 'create extension if not exists pg_cron';
      execute $cron$select cron.schedule('expire-student-access-codes', '*/15 * * * *', 'select public.expire_student_access_codes()')$cron$;
    exception when others then
      raise notice 'pg_cron unavailable (%); codes expire at sign-in time', sqlerrm;
    end;
  end if;
end $$;

commit;
