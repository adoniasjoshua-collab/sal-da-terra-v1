begin;

-- Fictitious adolescents that administrators use to rehearse the learner flow.
-- They stay out of rosters, dashboards and reports.
alter table public.students add column is_test boolean not null default false;

-- API roles can never mark or unmark a record as test data: that would hide a
-- real adolescent from pastoral indicators. Only create_test_student sets it.
create function public.protect_student_test_flag() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then new.is_test := false; else new.is_test := old.is_test; end if;
  end if;
  return new;
end; $$;
create trigger students_test_flag before insert or update on public.students
  for each row execute function public.protect_student_test_flag();

-- Links a brand-new Auth identity (created server-side by the invitation flow)
-- to an adolescent record. Runs with the administrator's session so the audit
-- actor is real and authorization is repeated at the data boundary.
create function public.provision_student_access(target_student uuid, target_profile uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.students;
begin
  select * into s from public.students where id = target_student for update;
  if not found or not public.has_ministry_role(s.ministry_id, array['admin']::public.member_role[]) then
    raise exception 'student_access_denied';
  end if;
  if not s.is_active or s.status = 'archived' then raise exception 'student_access_inactive'; end if;
  if s.auth_user_id is not null then raise exception 'student_access_exists'; end if;
  -- Never repurpose an account that already has a profile, access or student link.
  if not exists (select 1 from auth.users u where u.id = target_profile)
    or exists (select 1 from public.profiles p where p.id = target_profile)
    or exists (select 1 from public.ministry_members mm where mm.profile_id = target_profile)
    or exists (select 1 from public.students st where st.auth_user_id = target_profile) then
    raise exception 'student_access_identity';
  end if;
  insert into public.profiles(id, full_name) values (target_profile, s.full_name);
  insert into public.ministry_members(ministry_id, profile_id, role) values (s.ministry_id, target_profile, 'student');
  update public.students set auth_user_id = target_profile where id = s.id;
  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
    values (s.ministry_id, auth.uid(), 'provision_student_access', 'students', s.id, jsonb_build_object('is_test', s.is_test));
end; $$;

-- Authorizes and audits a new access link for an already linked adolescent.
-- Returns the Auth identity so the server can issue the link.
create function public.issue_student_access_link(target_student uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare s public.students;
begin
  select * into s from public.students where id = target_student;
  if not found or not public.has_ministry_role(s.ministry_id, array['admin']::public.member_role[]) then
    raise exception 'student_access_denied';
  end if;
  if s.auth_user_id is null then raise exception 'student_access_missing'; end if;
  if not s.is_active or s.status = 'archived' or not exists (select 1 from public.ministry_members mm
    where mm.ministry_id = s.ministry_id and mm.profile_id = s.auth_user_id and mm.role = 'student' and mm.is_active) then
    raise exception 'student_access_inactive';
  end if;
  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
    values (s.ministry_id, auth.uid(), 'issue_student_access_link', 'students', s.id, jsonb_build_object('is_test', s.is_test));
  return s.auth_user_id;
end; $$;

create function public.create_test_student(target_ministry uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not public.has_ministry_role(target_ministry, array['admin']::public.member_role[]) then
    raise exception 'student_access_denied';
  end if;
  if (select count(*) from public.students where ministry_id = target_ministry and is_test and is_active) >= 3 then
    raise exception 'student_test_limit';
  end if;
  insert into public.students(ministry_id, full_name, preferred_name, birth_date, guardian_name, guardian_phone,
    guardian_relationship, notes, created_by, is_test)
  values (target_ministry, 'Aluno de Teste (fictício)', 'Aluno Teste', current_date - interval '13 years',
    'Responsável fictício', '00000000000', 'Teste',
    'Cadastro fictício para testar o acesso do aluno. Não representa uma pessoa real.', auth.uid(), true)
  returning id into new_id;
  return new_id;
end; $$;

revoke all on function public.provision_student_access(uuid, uuid) from public, anon;
revoke all on function public.issue_student_access_link(uuid) from public, anon;
revoke all on function public.create_test_student(uuid) from public, anon;
grant execute on function public.provision_student_access(uuid, uuid) to authenticated;
grant execute on function public.issue_student_access_link(uuid) to authenticated;
grant execute on function public.create_test_student(uuid) to authenticated;

commit;
