import { z } from "zod";

export const createAccessSchema = z.object({
  student_id: z.uuid(),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido.")),
});
export const reissueAccessSchema = z.object({ student_id: z.uuid() });

export function accessLink(origin: string, tokenHash: string, type: "invite" | "recovery") {
  const url = new URL("/convite", origin);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  return url.toString();
}

// wa.me needs digits with country code; Brazilian numbers are stored locally (DDD + number).
export function whatsappNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (/^0+$/.test(digits)) return null;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  return null;
}

export function inviteMessage(name: string, link: string) {
  const login = new URL("/login", link).toString();
  return `Olá! Este é o link de acesso de ${name} ao portal Sal da Terra. Abra o link, toque em "Continuar" e crie a senha. O link é pessoal e expira em breve:\n${link}\n\nDepois de criar a senha, entre sempre com seu e-mail e senha em:\n${login}\n\nPara estudar, abra Conhecimento. Os módulos ficam disponíveis após a inscrição autorizada pela liderança.`;
}

export function accessError(message: string) {
  if (message.includes("student_access_exists")) return "Este adolescente já tem acesso. Use \"Gerar novo link\".";
  if (message.includes("student_access_inactive")) return "O cadastro ou o acesso está inativo. Reative antes de gerar o link.";
  if (message.includes("student_access_identity")) return "Este e-mail já pertence a outra conta. Use outro e-mail.";
  if (message.includes("student_test_limit")) return "Já existem 3 alunos de teste ativos. Arquive um antes de criar outro.";
  if (message.includes("student_access_denied")) return "Apenas administradores do ministério podem gerenciar este acesso.";
  return "Não foi possível concluir. Tente novamente.";
}
