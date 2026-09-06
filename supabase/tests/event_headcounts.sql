begin;
select plan(5);

insert into public.events (id, ministry_id, title, type, event_date, status, attendance_mode, created_by)
values ('94000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Headcount Test','worship','2026-09-06','planned','headcount_only','50000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select is((select count(*)::integer from public.event_headcounts where event_id = '94000000-0000-0000-0000-000000000001'), 0, 'student cannot read aggregate event counts');

select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);
select lives_ok(
  $$insert into public.event_headcounts (ministry_id,event_id,adolescent_count,visitor_count,registered_by)
    values ('20000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000001',20,4,'50000000-0000-0000-0000-000000000001')$$,
  'leader can save a headcount in the authorized ministry'
);
select is((select count(*)::integer from public.event_headcounts where event_id = '94000000-0000-0000-0000-000000000001'), 1, 'leader reads the saved aggregate count');

select throws_ok(
  $$insert into public.attendance (ministry_id,event_id,student_id,attendance_status,registered_by)
    values ('20000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','present','50000000-0000-0000-0000-000000000001')$$,
  'P0001',
  'headcount-only events do not accept individual attendance',
  'aggregate events reject individual attendance rows'
);
select throws_ok(
  $$update public.events set attendance_mode = 'participation_only' where id = '94000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'event participation mode cannot change after records exist',
  'event mode is immutable after a count exists'
);

select * from finish();
rollback;
