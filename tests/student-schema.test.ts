import { describe, expect, it } from "vitest";
import { studentSchema } from "../src/features/students/schema";

const valid = { full_name: "Pessoa DEMO", preferred_name: "", birth_date: "2011-01-01", gender: "", phone: "", guardian_name: "Responsável DEMO", guardian_phone: "000000000", guardian_relationship: "Mãe", joined_at: "2026-01-01", notes: "", status: "active" };
describe("student validation", () => {
  it("accepts the full create payload", () => expect(studentSchema.safeParse(valid).success).toBe(true));
  it("rejects incomplete guardian contact", () => expect(studentSchema.safeParse({ ...valid, guardian_phone: "12" }).success).toBe(false));
  it("requires the dedicated action for archiving", () => expect(studentSchema.safeParse({ ...valid, status: "archived" }).success).toBe(false));
});
