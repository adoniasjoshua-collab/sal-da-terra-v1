import { expect, it } from "vitest";
import {
  codeMessage, generateAccessCode, isQuickAccessEmail, loginEmail, quickAccessEmail, suggestUsername, usernameCandidate, usernameFromEmail,
} from "../src/services/student-quick-access";

it("suggests first and last name without accents or connectors", () => {
  expect(suggestUsername("João Pedro da Silva")).toBe("joao.silva");
  expect(suggestUsername("  Ana   Clara  ")).toBe("ana.clara");
  expect(suggestUsername("Zé")).toBe("ze.aluno");
  expect(suggestUsername("Maria D'Ávila")).toBe("maria.davila");
});

it("adds a number to taken usernames", () => {
  expect(usernameCandidate("joao.silva", 1)).toBe("joao.silva");
  expect(usernameCandidate("joao.silva", 2)).toBe("joao.silva2");
  expect(usernameCandidate("a".repeat(40), 12)).toHaveLength(40);
});

it("generates random, readable codes that satisfy the student password rule", () => {
  const codes = new Set(Array.from({ length: 200 }, () => generateAccessCode()));
  expect(codes.size).toBeGreaterThan(190);
  for (const code of codes) {
    expect(code).toMatch(/^[a-z]+-\d{4}-[a-z]+$/);
    expect(code.length).toBeGreaterThanOrEqual(10);
  }
  expect(generateAccessCode(() => 0)).toBe("agua-0000-agua");
});

it("maps usernames to the internal address and accepts e-mails at login", () => {
  expect(loginEmail(" Joao.Silva ")).toBe(quickAccessEmail("joao.silva"));
  expect(loginEmail("Lider@Example.com")).toBe("lider@example.com");
  expect(loginEmail("joão silva")).toBeNull();
  expect(loginEmail("a@")).toBeNull();
  expect(isQuickAccessEmail("joao.silva@alunos.saldaterra.invalid")).toBe(true);
  expect(usernameFromEmail("joao.silva@alunos.saldaterra.invalid")).toBe("joao.silva");
  expect(usernameFromEmail("joao@gmail.com")).toBeNull();
});

it("writes a share message with login address, username, code and expiry", () => {
  const message = codeMessage("João", "https://portal.example", "joao.silva", "pedra-4827-sol", "2026-11-18T22:30:00.000Z");
  expect(message).toContain("https://portal.example/login");
  expect(message).toContain("Usuário: joao.silva");
  expect(message).toContain("Código: pedra-4827-sol");
  expect(message).toContain("18/11");
});
