import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createUser: vi.fn(),
  maybeSingle: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminAuthClient: () => ({ createUser: mocks.createUser }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const query = { select: () => query, eq: () => query, maybeSingle: mocks.maybeSingle };
    return { from: () => query };
  },
}));
vi.mock("@/services/student-access", () => import("../src/services/student-access"));

import { createStudentAccess } from "../src/features/student-access/actions";

beforeEach(() => vi.resetAllMocks());

it("refreshes both screens when stale creation UI encounters an existing account", async () => {
  const id = "a0000000-0000-4000-8000-000000000001";
  mocks.requireAuth.mockResolvedValue({ role: "admin", ministryId: "ministry" });
  mocks.maybeSingle.mockResolvedValue({ data: { id, auth_user_id: "existing-account" } });
  const form = new FormData();
  form.set("student_id", id);
  form.set("email", "student@example.com");

  const result = await createStudentAccess(undefined, form);

  expect(result?.error).toContain("Gerar novo link");
  expect(mocks.revalidatePath).toHaveBeenCalledWith(`/adolescentes/${id}`);
  expect(mocks.revalidatePath).toHaveBeenCalledWith(`/adolescentes/${id}/editar`);
  expect(mocks.createUser).not.toHaveBeenCalled();
});

it("refuses non-admin creation before reading or changing an account", async () => {
  mocks.requireAuth.mockResolvedValue({ role: "leader" });
  const result = await createStudentAccess(undefined, new FormData());
  expect(result?.error).toContain("administradores");
  expect(mocks.maybeSingle).not.toHaveBeenCalled();
  expect(mocks.createUser).not.toHaveBeenCalled();
});
