begin;
select plan(3);

select throws_ok(
  $$
    update public.ministry_members
    set is_active = false
    where ministry_id = '20000000-0000-0000-0000-000000000001'
      and profile_id = '50000000-0000-0000-0000-000000000002'
  $$,
  'P0001',
  'ministry must retain at least one active admin',
  'the last active administrator cannot be disabled'
);

update public.ministry_members
set role = 'admin'
where ministry_id = '20000000-0000-0000-0000-000000000001'
  and profile_id = '50000000-0000-0000-0000-000000000001';

select lives_ok(
  $$
    update public.ministry_members
    set is_active = false
    where ministry_id = '20000000-0000-0000-0000-000000000001'
      and profile_id = '50000000-0000-0000-0000-000000000002'
  $$,
  'an administrator can be disabled when another active administrator exists'
);

select is(
  (select count(*)::integer from public.ministry_members where ministry_id = '20000000-0000-0000-0000-000000000001' and role = 'admin' and is_active),
  1,
  'the ministry retains one active administrator'
);

select * from finish();
rollback;
