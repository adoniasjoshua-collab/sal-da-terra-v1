import { z } from "zod";
import type { MemberRole } from "@/types/database";

// Adolescents (11–15) get a shorter rule; adults with access to pastoral data keep the strong one.
const policies = {
  student: { minLength: 8, hint: "Use pelo menos 8 caracteres, com letras e pelo menos um número." },
  staff: { minLength: 12, hint: "Use pelo menos 12 caracteres, com letras maiúsculas, minúsculas e número." },
} as const;

export function passwordPolicy(role: MemberRole | null) {
  return role === "student" ? policies.student : policies.staff;
}

export function passwordSchema(role: MemberRole | null) {
  const base = z.string().max(128, "A senha é muito longa.");
  const password = role === "student"
    ? base.min(8, "Use pelo menos 8 caracteres.").regex(/[A-Za-zÀ-ÿ]/, "Inclua pelo menos uma letra.").regex(/[0-9]/, "Inclua um número.")
    : base.min(12, "Use pelo menos 12 caracteres.").regex(/[a-z]/, "Inclua uma letra minúscula.").regex(/[A-Z]/, "Inclua uma letra maiúscula.").regex(/[0-9]/, "Inclua um número.");
  return z.object({ password, confirmation: z.string() })
    .refine((values) => values.password === values.confirmation, { message: "As senhas não são iguais.", path: ["confirmation"] });
}
