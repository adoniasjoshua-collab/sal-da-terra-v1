-- Fictitious local seed only. No production project. Every change rolls back.
begin;
select plan(15);
set local role authenticated;
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select public.learning_command('20000000-0000-0000-0000-000000000001','configure',null,
  '{"author":"50000000-0000-0000-0000-000000000002","reviewer":"50000000-0000-0000-0000-000000000001"}');
select public.learning_command('20000000-0000-0000-0000-000000000001','submit_review');
select throws_ok($$select public.learning_command('20000000-0000-0000-0000-000000000001','approve',null,'{"confirmed":true}')$$,
  'P0001','learning_invalid_transition','author cannot approve own content');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select is(public.learning_snapshot('20000000-0000-0000-0000-000000000001')->'content','null'::jsonb,'unpublished content is hidden');
select throws_ok($$select * from public.learning_versions$$,'42501',null,'answer-key table is inaccessible');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);
select public.learning_command('20000000-0000-0000-0000-000000000001','approve',null,'{"confirmed":true}');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select public.learning_command('20000000-0000-0000-0000-000000000001','publish',null,'{"confirmed":true}');
select public.learning_command('20000000-0000-0000-0000-000000000001','enroll','30000000-0000-0000-0000-000000000001','{"confirmed":true}');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select set_config('test.learning_enrollment',public.learning_snapshot('20000000-0000-0000-0000-000000000001')#>>'{enrollment,id}',true);
select ok(not (public.learning_snapshot('20000000-0000-0000-0000-000000000001')#>'{content,questions,0}' ? 'correct'),'projection strips answer keys');
select is(public.learning_snapshot('20000000-0000-0000-0000-000000000001')->'students','[]'::jsonb,'learner cannot see roster');
select throws_ok($$select public.learning_snapshot('20000000-0000-0000-0000-000000000099')$$,'P0001','learning_access_denied','other ministry denied');
select throws_ok($$select public.learning_command('20000000-0000-0000-0000-000000000001','summary',current_setting('test.learning_enrollment')::uuid)$$,
  'P0001','learning_prerequisite','cannot skip prerequisites');
select public.learning_command('20000000-0000-0000-0000-000000000001','reading',current_setting('test.learning_enrollment')::uuid,jsonb_build_object('reading',reading))
  from unnest(array['conhecido','acolhido','muitos-membros','respeito','conhecido']) reading;
select public.learning_command('20000000-0000-0000-0000-000000000001','exercise',current_setting('test.learning_enrollment')::uuid,'{"answer":1}');
select public.learning_command('20000000-0000-0000-0000-000000000001','save_draft',current_setting('test.learning_enrollment')::uuid,'{"answers":{"q1":0}}');
select is(public.learning_snapshot('20000000-0000-0000-0000-000000000001')#>'{enrollment,quiz_draft}','{"q1":0}'::jsonb,'draft persists');
select is(public.learning_command('20000000-0000-0000-0000-000000000001','quiz',current_setting('test.learning_enrollment')::uuid,
  '{"answers":{"q1":1,"q2":0,"q3":0,"q4":0},"requestId":"a0000000-0000-4000-8000-000000000001","score":100,"passed":true}')->>'passed','false','server ignores forged score');
select public.learning_command('20000000-0000-0000-0000-000000000001','quiz',current_setting('test.learning_enrollment')::uuid,
  '{"answers":{"q1":0,"q2":2,"q3":1,"q4":2},"requestId":"a0000000-0000-4000-8000-000000000002"}') from generate_series(1,2);
select is((public.learning_snapshot('20000000-0000-0000-0000-000000000001')#>>'{enrollment,xp}')::int,90,'retries do not duplicate XP');
select public.learning_command('20000000-0000-0000-0000-000000000001','summary',current_setting('test.learning_enrollment')::uuid);
select public.learning_command('20000000-0000-0000-0000-000000000001','request_practice',current_setting('test.learning_enrollment')::uuid);
select is(public.learning_snapshot('20000000-0000-0000-0000-000000000001')#>'{enrollment,completed_at}','null'::jsonb,'adult review required for completion');
select throws_ok($$select public.learning_command('20000000-0000-0000-0000-000000000001','review_practice',current_setting('test.learning_enrollment')::uuid,
  '{"decision":"approved","mode":"equivalent","note":"Student cannot validate."}')$$,'P0001','learning_access_denied','self validation denied');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);
select public.learning_command('20000000-0000-0000-0000-000000000001','review_practice',current_setting('test.learning_enrollment')::uuid,
  '{"decision":"approved","mode":"equivalent","note":"Supervised educational simulation."}');
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select is((public.learning_snapshot('20000000-0000-0000-0000-000000000001')#>>'{enrollment,xp}')::int,220,'complete world has 220 XP');
select ok(public.learning_snapshot('20000000-0000-0000-0000-000000000001')#>>'{enrollment,completed_at}' is not null,'completion and badge recorded');
select ok(not (public.learning_snapshot('20000000-0000-0000-0000-000000000001')->'enrollment' ? 'review_note'),'staff justification is not exposed');
reset role;
select * from finish();
rollback;
