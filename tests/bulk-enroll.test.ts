import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn(), rpc: vi.fn(), tests: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/services/learning", async () => await import("../src/services/learning"));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  rpc: mocks.rpc,
  from: () => ({ select: () => ({ eq: () => ({ eq: mocks.tests }) }) }),
}) }));
import { enrollAllEligible } from "../src/features/learning/actions";

const ministry = "20000000-0000-0000-0000-000000000001";
const confirmed = () => { const form = new FormData(); form.set("confirmed", "on"); return form; };
const snapshot = { students: [
  { id: "real-1", name: "Ana", hasAccount: true, enrollment: null },
  { id: "real-2", name: "Bia", hasAccount: true, enrollment: { is_active: true } },
  { id: "no-account", name: "Caio", hasAccount: false, enrollment: null },
  { id: "test-1", name: "Teste", hasAccount: true, enrollment: null },
] };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAuth.mockResolvedValue({ role: "admin", ministryId: ministry });
  mocks.tests.mockResolvedValue({ data: [{ id: "test-1" }], error: null });
  mocks.rpc.mockImplementation(async (name: string) => name === "learning_snapshot" ? { data: snapshot, error: null } : { data: {}, error: null });
});

it("enrolls only real learners with an account and no active enrollment", async () => {
  expect(await enrollAllEligible(undefined, confirmed())).toEqual({ success: "1 aluno(s) inscrito(s)." });
  const enrolls = mocks.rpc.mock.calls.filter(([name]) => name === "learning_command");
  expect(enrolls).toEqual([["learning_command", { target_ministry: ministry, command: "enroll", target_id: "real-1", payload: { confirmed: true } }]]);
});

it("requires an administrator and explicit guardian confirmation", async () => {
  expect((await enrollAllEligible(undefined, new FormData()))?.error).toMatch(/Confirme/);
  mocks.requireAuth.mockResolvedValue({ role: "leader", ministryId: ministry });
  expect((await enrollAllEligible(undefined, confirmed()))?.error).toMatch(/administradores/);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
