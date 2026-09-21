import { describe, expect, it } from "vitest";
import { studentSchema, studentUpdateSchema } from "../src/features/students/schema";

const valid = { full_name: "Pessoa DEMO", preferred_name: "", birth_date: "2011-01-01", gender: "", phone: "", guardian_name: "Responsável DEMO", guardian_phone: "000000000", guardian_relationship: "Mãe", joined_at: "2026-01-01", notes: "", status: "active" };
describe("student validation", () => {
  it("accepts the full create payload", () => expect(studentSchema.safeParse(valid).success).toBe(true));
  it("rejects incomplete guardian contact", () => expect(studentSchema.safeParse({ ...valid, guardian_phone: "12" }).success).toBe(false));
  it("rejects archived status for a new registration", () => expect(studentSchema.safeParse({ ...valid, status: "archived" }).success).toBe(false));
  it.each(["active", "inactive", "visitor", "archived"])("allows editing status %s", (status) => {
    expect(studentUpdateSchema.safeParse({ ...valid, status }).success).toBe(true);
  });
  it("rejects unknown status when editing", () => expect(studentUpdateSchema.safeParse({ ...valid, status: "deleted" }).success).toBe(false));
});
