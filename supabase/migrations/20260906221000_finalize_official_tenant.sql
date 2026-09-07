begin;

do $$
begin
  if not exists (
    select 1 from auth.users
    where id = '27bb211d-037b-4bff-98b0-e5b06683c0f1'
      and email = 'adonias.joshua@gmail.com'
  ) then
    raise exception 'official auth administrator is missing';
  end if;

  if not exists (
    select 1 from public.ministry_members
    where ministry_id = '20000000-0000-0000-0000-000000000001'
      and profile_id = '27bb211d-037b-4bff-98b0-e5b06683c0f1'
      and role = 'admin'
      and is_active
  ) then
    raise exception 'official administrator membership is missing';
  end if;

  if exists (select 1 from public.students)
    or exists (select 1 from public.events)
    or exists (select 1 from public.attendance)
    or exists (select 1 from public.event_headcounts)
    or exists (select 1 from public.pastoral_followups)
  then
    raise exception 'operational demonstration records were not fully cleared';
  end if;

  if not exists (
    select 1
    from public.churches c
    join public.ministries m on m.church_id = c.id
    where c.name = 'Igreja Pioneira'
      and m.name = 'Madureira'
  ) then
    raise exception 'official church and ministry names were not configured';
  end if;
end;
$$;

-- Demonstration credentials are published in the development documentation and
-- must not remain usable after the official administrator has been provisioned.
delete from public.ministry_members
where profile_id in (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000003'
);

delete from auth.users
where id in (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000003'
);

do $$
begin
  if exists (
    select 1 from auth.users
    where email in (
      'lider.demo@saldaterra.invalid',
      'admin.demo@saldaterra.invalid',
      'aluno.demo@saldaterra.invalid'
    )
  ) then
    raise exception 'demonstration auth accounts are still present';
  end if;
end;
$$;

commit;
