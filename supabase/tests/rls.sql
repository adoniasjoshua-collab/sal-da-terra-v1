begin;
select plan(8);

-- These UUIDs are isolated fixtures. The local test runner executes as postgres.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
 ('90000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','student@test.invalid','',now(),now(),now()),
 ('90000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','leader@test.invalid','',now(),now(),now());
insert into public.profiles(id, full_name) values
 ('90000000-0000-0000-0000-000000000001','Student Test'),('90000000-0000-0000-0000-000000000002','Leader Test');
insert into public.ministry_members(ministry_id,profile_id,role) values
 ('20000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','student'),
 ('20000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000002','leader');
update public.students set auth_user_id='90000000-0000-0000-0000-000000000001' where id='30000000-0000-0000-0000-000000000001';
insert into public.churches(id,name,slug) values ('91000000-0000-0000-0000-000000000001','Other Church Test','other-church-test');
insert into public.ministries(id,church_id,name) values ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','Other Ministry Test');
insert into public.students(id,ministry_id,full_name,birth_date,guardian_name,guardian_phone,guardian_relationship) values ('93000000-0000-0000-0000-000000000001','92000000-0000-0000-0000-000000000001','Other Student Test','2011-01-01','Other Guardian','000000000','Parent');

set local role authenticated;
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from public.students), 0, 'student cannot query base student records');
select is((select count(*)::integer from public.pastoral_followups), 0, 'student cannot read followups');
select is((select count(*)::integer from public.get_my_student_profile()), 1, 'student receives own safe profile');
select ok((select count(*) from public.get_my_attendance()) > 0, 'student receives own attendance through safe RPC');

reset role;
update public.ministry_members
set is_active = false
where ministry_id = '20000000-0000-0000-0000-000000000001'
  and profile_id = '90000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from public.get_my_student_profile()), 0, 'revoked student cannot receive safe profile');
select is((select count(*)::integer from public.get_my_attendance()), 0, 'revoked student cannot receive attendance');

select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from public.students), 5, 'leader reads own ministry and not another ministry');

select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from public.students), 5, 'admin remains scoped to authorized ministry');

select * from finish();
rollback;
