import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createUser: vi.fn(),
  generateLink: vi.fn(),
  deleteUser: vi.fn(),
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ origin: "https://portal.example" }) }));
vi.mock("@/lib/auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/portal-origin", () => ({ portalOrigin: async () => "https://portal.example" }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminAuthClient: () => ({ createUser: mocks.createUser, generateLink: mocks.generateLink, deleteUser: mocks.deleteUser }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const query = { select: () => query, eq: () => query, maybeSingle: mocks.maybeSingle };
    return { from: () => query, rpc: mocks.rpc };
  },
}));
vi.mock("@/services/student-access", () => import("../src/services/student-access"));

import { createStudentAccess } from "../src/features/student-access/actions";

beforeEach(() => vi.resetAllMocks());

it("refreshes both screens when stale creation UI encounters an existing account", async () => {
  const id = "a0000000-0000-4000-8000-000000000001";
  mocks.requireAuth.mockResolvedValue({ role: "admin", ministryId: "ministry" });
  mocks.maybeSingle.mockResolvedValue({ data: { id, auth_user_id: "existing-account", is_active: true, status: "active" } });
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

const studentId = "a0000000-0000-4000-8000-000000000001";
function invitationForm() {
  const form = new FormData();
  form.set("student_id", studentId);
  form.set("email", "student@example.com");
  return form;
}

it("does not create an Auth identity for an inactive student", async () => {
  mocks.requireAuth.mockResolvedValue({ role: "admin", ministryId: "ministry" });
  mocks.maybeSingle.mockResolvedValue({ data: { id: studentId, is_active: false } });
  expect((await createStudentAccess(undefined, invitationForm()))?.error).toContain("inativo");
  expect(mocks.createUser).not.toHaveBeenCalled();
});

it("does not confuse a failed read with a missing student", async () => {
  mocks.requireAuth.mockResolvedValue({ role: "admin", ministryId: "ministry" });
  mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "offline" } });
  expect((await createStudentAccess(undefined, invitationForm()))?.error).toContain("consultar");
  expect(mocks.createUser).not.toHaveBeenCalled();
});

it.each([
  { properties: {}, user: { id: "new-identity" } },
  { properties: { hashed_token: "token" }, user: { id: "other-identity" } },
])("never links an incomplete or mismatched Auth link response", async (data) => {
  mocks.requireAuth.mockResolvedValue({ role: "admin", ministryId: "ministry" });
  mocks.maybeSingle.mockResolvedValue({ data: { id: studentId, is_active: true, status: "active" } });
  mocks.createUser.mockResolvedValue({ data: { user: { id: "new-identity" } } });
  mocks.generateLink.mockResolvedValue({ data });
  expect((await createStudentAccess(undefined, invitationForm()))?.error).toContain("gerar o convite");
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.deleteUser).toHaveBeenCalledWith("new-identity");
});

it("returns a usable invitation only after authorized provisioning and preserves the identity", async () => {
  mocks.requireAuth.mockResolvedValue({ role: "admin", ministryId: "ministry" });
  mocks.maybeSingle.mockResolvedValue({ data: { id: studentId, full_name: "Aluno Teste", guardian_phone: "00000000000", is_active: true, status: "active" } });
  mocks.createUser.mockResolvedValue({ data: { user: { id: "new-identity" } } });
  mocks.generateLink.mockResolvedValue({ data: { properties: { hashed_token: "personal-token" }, user: { id: "new-identity" } } });
  mocks.rpc.mockResolvedValue({ error: null });
  const result = await createStudentAccess(undefined, invitationForm());
  expect(mocks.rpc).toHaveBeenCalledWith("provision_student_access", { target_student: studentId, target_profile: "new-identity" });
  expect(result?.link).toBe("https://portal.example/convite?token_hash=personal-token&type=invite");
  expect(result?.message).toContain("https://portal.example/login");
  expect(result?.whatsapp).toBeNull();
  expect(mocks.deleteUser).not.toHaveBeenCalled();
});
