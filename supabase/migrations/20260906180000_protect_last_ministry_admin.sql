begin;

create or replace function public.protect_last_active_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.is_active and (new.role <> 'admin' or not new.is_active) then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(old.ministry_id::text, 0));
    if not exists (
      select 1 from public.ministry_members mm
      where mm.ministry_id = old.ministry_id and mm.id <> old.id and mm.role = 'admin' and mm.is_active
    ) then
      raise exception 'ministry must retain at least one active admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_last_active_admin on public.ministry_members;
create trigger protect_last_active_admin before update on public.ministry_members
for each row execute function public.protect_last_active_admin();

comment on function public.protect_last_active_admin() is 'Prevents role changes or deactivation from leaving a ministry without an active administrator.';

commit;
