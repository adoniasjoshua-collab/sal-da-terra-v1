import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ role: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(url); } }));
vi.mock("@/lib/auth", () => ({ getCurrentRole: mocks.role }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { verifyOtp: mocks.verifyOtp } }) }));
import { acceptInvite } from "../src/features/auth/invite-actions";
beforeEach(() => vi.resetAllMocks());
const form = () => {
  const data = new FormData();
  data.set("token_hash", "test-token-123456");
  data.set("type", "invite");
  return data;
};
it.each(["admin", "leader"])("preserves a %s session and leaves the invitation unconsumed", async (role) => {
  mocks.role.mockResolvedValue(role);
  await expect(acceptInvite(form())).rejects.toThrow("/convite?erro=sessao-equipe");
  expect(mocks.verifyOtp).not.toHaveBeenCalled();
});
it("verifies the invitation on explicit submission in a separate session", async () => {
  mocks.role.mockResolvedValue(null);
  mocks.verifyOtp.mockResolvedValue({ error: null });
  await expect(acceptInvite(form())).rejects.toThrow("/definir-senha");
  expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "test-token-123456", type: "invite" });
});
it("explains an expired invitation without opening password setup", async () => {
  mocks.role.mockResolvedValue(null);
  mocks.verifyOtp.mockResolvedValue({ error: { message: "expired" } });
  await expect(acceptInvite(form())).rejects.toThrow("/login?erro=convite-invalido");
});
