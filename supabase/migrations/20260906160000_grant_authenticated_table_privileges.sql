begin;

-- PostgreSQL privileges permit PostgREST to reach the RLS layer. RLS remains
-- responsible for row-level tenant and role authorization.
grant usage on schema public to authenticated;

grant select on table
  public.churches,
  public.ministries,
  public.profiles,
  public.ministry_members,
  public.students,
  public.events,
  public.attendance,
  public.pastoral_followups,
  public.audit_logs
to authenticated;

grant insert, update on table
  public.ministry_members,
  public.students,
  public.events,
  public.attendance,
  public.pastoral_followups
to authenticated;
grant update on table public.profiles to authenticated;

-- Deliberately omitted: DELETE on every table, direct audit writes, and direct
-- church/ministry writes. Those operations are outside the V1 application API.

commit;
