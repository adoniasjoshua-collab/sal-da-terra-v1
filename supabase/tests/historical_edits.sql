-- Local seed only. Every change is rolled back.
begin;
select plan(8);
set local role authenticated;
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);

insert into public.pastoral_followups(id,ministry_id,student_id,leader_id,followup_type,occurred_at,summary,status)
values ('96000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
  'conversation',now(),'Fictitious test content','open');

select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
update public.ministry_members set is_active=false
where ministry_id='20000000-0000-0000-0000-000000000001'
  and profile_id in ('50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003');

select lives_ok($$update public.students set preferred_name='Edited DEMO'
  where id='30000000-0000-0000-0000-000000000001'$$,
  'admin edits a student whose login was deactivated');
select lives_ok($$update public.pastoral_followups set status='completed'
  where id='96000000-0000-0000-0000-000000000001'$$,
  'admin completes follow-up after original leader leaves');
select is((select leader_id::text from public.pastoral_followups where id='96000000-0000-0000-0000-000000000001'),
  '50000000-0000-0000-0000-000000000001','original author is preserved');
select is((select status::text from public.pastoral_followups where id='96000000-0000-0000-0000-000000000001'),
  'completed','status change is persisted');
select ok(exists(select 1 from public.audit_logs where entity_id='96000000-0000-0000-0000-000000000001'
  and action='update_pastoral_followups' and metadata='{"operation":"UPDATE"}'::jsonb),
  'edit is audited without pastoral content');
select throws_ok($$update public.students set auth_user_id='50000000-0000-0000-0000-000000000003'
  where id='30000000-0000-0000-0000-000000000002'$$,
  'P0001','student auth identity must have an active student membership in the same ministry',
  'new assignment to an inactive student is rejected');
select throws_ok($$insert into public.pastoral_followups(ministry_id,student_id,leader_id,followup_type,occurred_at,summary)
  values ('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001','conversation',now(),'Fictitious test content')$$,
  'P0001','follow-up relationships must share ministry and authorized leader',
  'new follow-up cannot be attributed to an inactive leader');

-- The disabled leader cannot use the historical-edit exception to write.
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);
with changed as (update public.pastoral_followups set status='cancelled'
  where id='96000000-0000-0000-0000-000000000001' returning id)
select is((select count(*)::integer from changed),0,'RLS still prevents inactive staff writes');
select * from finish();
rollback;
