import { z } from "zod";

export const createStaffSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome completo.").max(160),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido.")),
});
export const reissueStaffSchema = z.object({ member_id: z.uuid() });

export function staffInviteMessage(name: string, link: string) {
  const login = new URL("/login", link).toString();
  return `Olá, ${name}! Você foi convidado(a) para a liderança do portal Sal da Terra. Abra o link, toque em "Continuar" e crie sua senha. O link é pessoal e expira em breve:\n${link}\n\nDepois, entre sempre com seu e-mail e senha em:\n${login}`;
}

export function staffAccessError(message: string) {
  if (message.includes("staff_access_identity")) return "Este e-mail já pertence a outra conta. Use outro e-mail ou ajuste o vínculo existente em Controle de acesso.";
  if (message.includes("staff_access_invalid")) return "Informe o nome completo (2 a 160 caracteres).";
  if (message.includes("staff_access_inactive")) return "Só é possível gerar link para líderes com acesso ativo (não para administradores nem para você).";
  if (message.includes("staff_access_denied")) return "Apenas administradores do ministério podem convidar líderes.";
  return "Não foi possível concluir. Tente novamente.";
}
