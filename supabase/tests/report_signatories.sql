begin;
select plan(4);

set local role authenticated;
select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000003',true);
select is((select count(*)::integer from public.report_signatories), 0, 'student cannot read report signatories');

select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000001',true);
select throws_ok(
  $$insert into public.report_signatories(ministry_id,full_name,created_by) values ('20000000-0000-0000-0000-000000000001','Leader Test','50000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'leader cannot configure report signatories'
);

select set_config('request.jwt.claim.sub','50000000-0000-0000-0000-000000000002',true);
select lives_ok(
  $$insert into public.report_signatories(ministry_id,full_name,created_by) values ('20000000-0000-0000-0000-000000000001','Admin Signer Test','50000000-0000-0000-0000-000000000002')$$,
  'admin can configure a report signatory'
);
select is(
  (select count(*)::integer from public.report_signatories where full_name = 'Admin Signer Test'),
  1,
  'admin reads the configured signatory in the authorized ministry'
);

select * from finish();
rollback;
