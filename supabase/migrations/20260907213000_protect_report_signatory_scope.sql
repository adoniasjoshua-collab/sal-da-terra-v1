begin;

alter table public.report_signatories
  add constraint report_signatories_email_format_check
  check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

create function public.preserve_report_signatory_scope()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.ministry_id := old.ministry_id;
  new.created_by := old.created_by;
  return new;
end;
$$;

create trigger report_signatory_scope_immutable before update on public.report_signatories
for each row execute function public.preserve_report_signatory_scope();

commit;
