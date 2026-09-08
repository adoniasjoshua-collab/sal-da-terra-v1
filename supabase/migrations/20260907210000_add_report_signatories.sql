begin;

create table public.report_signatories (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid not null references public.ministries(id) on delete restrict,
  full_name text not null check (char_length(full_name) between 2 and 160),
  role_title text not null default 'Liderança de adolescentes' check (char_length(role_title) between 2 and 100),
  phone text check (phone is null or char_length(phone) between 8 and 30),
  email text check (email is null or char_length(email) <= 254),
  display_order smallint not null default 0 check (display_order between 0 and 20),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index report_signatories_ministry_idx on public.report_signatories(ministry_id, is_active, display_order);
create trigger report_signatories_updated before update on public.report_signatories
for each row execute function public.set_updated_at();
create trigger audit_report_signatories after insert or update on public.report_signatories
for each row execute function public.audit_administrative_change();

alter table public.report_signatories enable row level security;
create policy report_signatories_staff_select on public.report_signatories for select to authenticated
using (public.has_ministry_role(ministry_id, array['leader','admin']::public.member_role[]));
create policy report_signatories_admin_insert on public.report_signatories for insert to authenticated
with check (public.has_ministry_role(ministry_id, array['admin']::public.member_role[]) and created_by = auth.uid());
create policy report_signatories_admin_update on public.report_signatories for update to authenticated
using (public.has_ministry_role(ministry_id, array['admin']::public.member_role[]))
with check (public.has_ministry_role(ministry_id, array['admin']::public.member_role[]));

grant select, insert, update on table public.report_signatories to authenticated;
revoke delete, truncate, references, trigger on table public.report_signatories from authenticated;

comment on table public.report_signatories is 'Adult ministry contacts authorized to sign operational reports; never stores minor or pastoral data.';

commit;
