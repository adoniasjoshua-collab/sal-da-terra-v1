import { describe, expect, it } from "vitest";
import { passwordSchema } from "../src/services/password-policy";
import { accessLink, createAccessSchema, inviteMessage, whatsappNumber } from "../src/services/student-access";

describe("student access helpers", () => {
  it("separates the personal first-access token from the permanent login address", () => {
    const message = inviteMessage("Aluno Teste", accessLink("https://portal.example", "personal-token", "invite"));
    expect(message).toContain("https://portal.example/login");
    expect(message.match(/personal-token/g)).toHaveLength(1);
    expect(message).toContain("Conhecimento");
  });
  it("builds a side-effect-free confirmation link on the portal origin", () => {
    expect(accessLink("https://portal.example", "abc123_-", "invite")).toBe("https://portal.example/convite?token_hash=abc123_-&type=invite");
  });
  it("normalizes Brazilian phones for WhatsApp and rejects placeholders", () => {
    expect(whatsappNumber("(21) 99876-5432")).toBe("5521998765432");
    expect(whatsappNumber("+55 21 3456-7890")).toBe("552134567890");
    expect(whatsappNumber("123")).toBeNull();
    expect(whatsappNumber("00000000000")).toBeNull();
    expect(whatsappNumber(null)).toBeNull();
  });
  it("normalizes and validates the invitation e-mail", () => {
    expect(createAccessSchema.parse({ student_id: "a0000000-0000-4000-8000-000000000001", email: " Aluno@Example.COM " }).email).toBe("aluno@example.com");
    expect(createAccessSchema.safeParse({ student_id: "a0000000-0000-4000-8000-000000000001", email: "not-an-email" }).success).toBe(false);
  });
});

describe("password policy by role", () => {
  const check = (role: "student" | "admin", password: string) => passwordSchema(role).safeParse({ password, confirmation: password }).success;
  it("accepts a simpler password for adolescents", () => {
    expect(check("student", "sal2026abc")).toBe(true);
    expect(check("student", "abcdefgh")).toBe(false);
    expect(check("student", "abc123")).toBe(false);
  });
  it("keeps the strong rule for leadership", () => {
    expect(check("admin", "sal2026abc")).toBe(false);
    expect(check("admin", "SalDaTerra2026x")).toBe(true);
  });
});
