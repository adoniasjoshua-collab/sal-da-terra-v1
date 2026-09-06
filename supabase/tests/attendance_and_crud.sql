begin;
select plan(8);
set local role authenticated;
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);

insert into public.students(id,ministry_id,full_name,birth_date,guardian_name,guardian_phone,guardian_relationship,created_by)
values ('94000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','CRUD Student Test','2011-01-01','CRUD Guardian','000000000','Parent','50000000-0000-0000-0000-000000000001');
select is((select count(*)::integer from public.students where id='94000000-0000-0000-0000-000000000001'),1,'leader creates student');

update public.students set preferred_name='Edited' where id='94000000-0000-0000-0000-000000000001';
select is((select preferred_name from public.students where id='94000000-0000-0000-0000-000000000001'),'Edited','leader edits student');

update public.students set status='archived',is_active=false,archived_at=now() where id='94000000-0000-0000-0000-000000000001';
select is((select status::text from public.students where id='94000000-0000-0000-0000-000000000001'),'archived','student is soft archived');

update public.students set status='active',is_active=true,archived_at=null where id='94000000-0000-0000-0000-000000000001';
select ok((select is_active from public.students where id='94000000-0000-0000-0000-000000000001'),'student can be reactivated');

insert into public.attendance(ministry_id,event_id,student_id,attendance_status,registered_by)
values ('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000006','94000000-0000-0000-0000-000000000001','absent','50000000-0000-0000-0000-000000000001');
insert into public.attendance(ministry_id,event_id,student_id,attendance_status,registered_by)
values ('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000006','94000000-0000-0000-0000-000000000001','present','50000000-0000-0000-0000-000000000001')
on conflict(event_id,student_id) do update set attendance_status=excluded.attendance_status,registered_by=excluded.registered_by;
select is((select attendance_status::text from public.attendance where event_id='40000000-0000-0000-0000-000000000006' and student_id='94000000-0000-0000-0000-000000000001'),'present','attendance upsert updates status');
select is((select count(*)::integer from public.attendance where event_id='40000000-0000-0000-0000-000000000006' and student_id='94000000-0000-0000-0000-000000000001'),1,'attendance unique pair prevents duplication');

select throws_ok(
  $$update public.attendance set attendance_status='not_participated' where event_id='40000000-0000-0000-0000-000000000006' and student_id='94000000-0000-0000-0000-000000000001'$$,
  'P0001', 'full roster events require an attendance outcome',
  'full roster rejects neutral non-participation'
);
select throws_ok(
  $$insert into public.attendance(ministry_id,event_id,student_id,attendance_status,registered_by) values ('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000007','94000000-0000-0000-0000-000000000001','absent','50000000-0000-0000-0000-000000000001')$$,
  'P0001', 'optional events do not record absence outcomes',
  'optional participation rejects absence outcomes'
);

select * from finish();
rollback;
