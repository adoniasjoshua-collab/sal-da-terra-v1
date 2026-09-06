begin;

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  updated_at = now()
where email in (
  'lider.demo@saldaterra.invalid',
  'admin.demo@saldaterra.invalid',
  'aluno.demo@saldaterra.invalid'
);

commit;
