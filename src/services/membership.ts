import type { MemberRole } from "@/types/database";

export function removesActiveAdmin(
  currentRole: MemberRole,
  currentActive: boolean,
  nextRole: MemberRole,
  nextActive: boolean,
) {
  return currentRole === "admin" && currentActive && (nextRole !== "admin" || !nextActive);
}
