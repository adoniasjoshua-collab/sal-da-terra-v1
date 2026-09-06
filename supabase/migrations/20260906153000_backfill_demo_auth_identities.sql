begin;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email in (
  'lider.demo@saldaterra.invalid',
  'admin.demo@saldaterra.invalid',
  'aluno.demo@saldaterra.invalid'
)
on conflict (provider_id, provider) do nothing;

commit;
