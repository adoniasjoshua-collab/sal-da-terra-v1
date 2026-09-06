begin;

-- These ownership-like privileges are not needed by the application. In
-- particular, TRUNCATE bypasses row-level security and must never be exposed.
revoke truncate, references, trigger on table
  public.churches,
  public.ministries,
  public.profiles,
  public.ministry_members,
  public.students,
  public.events,
  public.attendance,
  public.pastoral_followups,
  public.audit_logs
from authenticated;

-- Profile creation is controlled by the Auth/database provisioning flow.
revoke insert on table public.profiles from authenticated;
grant update on table public.profiles to authenticated;

commit;
