import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ eq: vi.fn(), maybeSingle: vi.fn(), getUserById: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminAuthClient: () => ({ getUserById: mocks.getUserById }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => {
  const query = { select: () => query, eq: mocks.eq, maybeSingle: mocks.maybeSingle };
  mocks.eq.mockReturnValue(query);
  return { from: () => query };
} }));
import { getStudentAccess } from "../src/features/student-access/data";

beforeEach(() => vi.resetAllMocks());

it("scopes membership to the student's ministry and student role", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: { is_active: true } });
  mocks.getUserById.mockResolvedValue({ data: { user: { email: "test@example.com", email_confirmed_at: null } } });
  expect((await getStudentAccess("identity", "ministry", true)).status).toBe("pending");
  expect(mocks.eq).toHaveBeenCalledWith("ministry_id", "ministry");
  expect(mocks.eq).toHaveBeenCalledWith("role", "student");
});

it("blocks inactive registrations even before account creation", async () => {
  expect((await getStudentAccess(null, "ministry", false)).status).toBe("inactive");
  expect(mocks.getUserById).not.toHaveBeenCalled();
});

it("keeps lookup errors distinct from inactive or missing access", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "offline" } });
  expect((await getStudentAccess("identity", "ministry", true)).status).toBe("unavailable");
  expect(mocks.getUserById).not.toHaveBeenCalled();
});

it("does not label a missing Auth identity as active", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: { is_active: true } });
  mocks.getUserById.mockResolvedValue({ data: { user: null }, error: { message: "not found" } });
  expect((await getStudentAccess("identity", "ministry", true)).status).toBe("unavailable");
});
