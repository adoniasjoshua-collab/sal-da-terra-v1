import { describe, expect, it } from "vitest";
import { followupSchema, followupValues } from "../src/features/followups/schema";

const valid = {
  student_id: "94000000-0000-4000-8000-000000000001", followup_type: "conversation",
  occurred_at: "2026-09-21T10:30", summary: "Registro fictício para teste", status: "open",
  next_action: "", next_action_date: "",
};

describe("follow-up editing", () => {
  it("converts ministry time to UTC without depending on server time zone", () => {
    const values = followupValues(followupSchema.parse(valid));
    expect(values.occurred_at).toBe("2026-09-21T13:30:00.000Z");
    expect(values.next_action_date).toBeNull();
  });
  it.each(["open", "completed", "cancelled"])("allows status %s", (status) => {
    expect(followupSchema.safeParse({ ...valid, status }).success).toBe(true);
  });
  it.each(["not-a-date", "2026-02-30T10:30", "2026-09-21T10:30Z", "2026-09-21T25:00"])("rejects malformed date %s before mutation", (occurred_at) => {
    expect(followupSchema.safeParse({ ...valid, occurred_at }).success).toBe(false);
  });
  it("rejects invalid lifecycle and next-action dates", () => {
    expect(followupSchema.safeParse({ ...valid, status: "deleted" }).success).toBe(false);
    expect(followupSchema.safeParse({ ...valid, next_action_date: "2026-02-30" }).success).toBe(false);
  });
});
