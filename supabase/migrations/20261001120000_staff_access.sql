begin;

-- Links a brand-new Auth identity (created server-side by the invitation flow)
-- to the ministry as a leader. Promotion to admin stays a separate, explicit
-- membership change in Administration.
create function public.provision_staff_access(target_ministry uuid, target_profile uuid, display_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare clean_name text := btrim(coalesce(display_name, '')); member_id uuid;
begin
  if not public.has_ministry_role(target_ministry, array['admin']::public.member_role[]) then
    raise exception 'staff_access_denied';
  end if;
  if char_length(clean_name) not between 2 and 160 then raise exception 'staff_access_invalid'; end if;
  -- Never repurpose an account that already has a profile, access or student link.
  if not exists (select 1 from auth.users u where u.id = target_profile)
    or exists (select 1 from public.profiles p where p.id = target_profile)
    or exists (select 1 from public.ministry_members mm where mm.profile_id = target_profile)
    or exists (select 1 from public.students st where st.auth_user_id = target_profile) then
    raise exception 'staff_access_identity';
  end if;
  insert into public.profiles(id, full_name) values (target_profile, clean_name);
  insert into public.ministry_members(ministry_id, profile_id, role) values (target_ministry, target_profile, 'leader')
    returning id into member_id;
  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
    values (target_ministry, auth.uid(), 'provision_staff_access', 'ministry_members', member_id, jsonb_build_object('role', 'leader'));
end; $$;

-- Authorizes and audits a new access link for an active leader. Admin accounts
-- are excluded so one administrator cannot obtain a sign-in link for another.
create function public.issue_staff_access_link(target_member uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare m public.ministry_members;
begin
  select * into m from public.ministry_members where id = target_member;
  if not found or not public.has_ministry_role(m.ministry_id, array['admin']::public.member_role[]) then
    raise exception 'staff_access_denied';
  end if;
  if m.role <> 'leader' or not m.is_active or m.profile_id = auth.uid() then raise exception 'staff_access_inactive'; end if;
  insert into public.audit_logs(ministry_id, actor_id, action, entity_type, entity_id, metadata)
    values (m.ministry_id, auth.uid(), 'issue_staff_access_link', 'ministry_members', m.id, jsonb_build_object('role', m.role));
  return m.profile_id;
end; $$;

revoke all on function public.provision_staff_access(uuid, uuid, text) from public, anon;
revoke all on function public.issue_staff_access_link(uuid) from public, anon;
grant execute on function public.provision_staff_access(uuid, uuid, text) to authenticated;
grant execute on function public.issue_staff_access_link(uuid) to authenticated;

commit;
