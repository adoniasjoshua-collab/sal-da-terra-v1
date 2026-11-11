import { randomInt } from "node:crypto";
import { z } from "zod";

// Internal, never-delivered address for accounts that sign in with a username.
// `.invalid` is reserved (RFC 2606), so no message can ever reach a real inbox.
export const QUICK_ACCESS_DOMAIN = "alunos.saldaterra.invalid";
export const CODE_VALIDITY_DAYS = 7;

const usernamePattern = /^[a-z0-9]+(\.[a-z0-9]+)*$/;
export const usernameSchema = z.string().trim().toLowerCase().min(3, "Use pelo menos 3 caracteres no usuário.").max(40, "Use no máximo 40 caracteres no usuário.")
  .regex(usernamePattern, "Use apenas letras sem acento, números e pontos (ex.: joao.silva).");

export const quickAccessSchema = z.object({ student_id: z.uuid(), username: usernameSchema });
export const reissueCodeSchema = z.object({ student_id: z.uuid() });

function plain(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// "João Pedro da Silva" -> "joao.silva": first and last name, connectors ignored.
export function suggestUsername(fullName: string) {
  const parts = fullName.split(/\s+/).map(plain).filter((part) => part && !["da", "de", "do", "das", "dos", "e"].includes(part));
  const base = (parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0] ?? "aluno").slice(0, 36);
  return base.length >= 3 ? base : `${base}.aluno`;
}

// joao.silva, joao.silva2, joao.silva3 … for the automatic retry on collisions.
export function usernameCandidate(base: string, attempt: number) {
  return attempt <= 1 ? base : `${base.slice(0, 38)}${attempt}`;
}

export function quickAccessEmail(username: string) {
  return `${username}@${QUICK_ACCESS_DOMAIN}`;
}

export function isQuickAccessEmail(email: string | null | undefined) {
  return Boolean(email?.toLowerCase().endsWith(`@${QUICK_ACCESS_DOMAIN}`));
}

export function usernameFromEmail(email: string | null | undefined) {
  return isQuickAccessEmail(email) ? email!.slice(0, -(QUICK_ACCESS_DOMAIN.length + 1)) : null;
}

// Short, easy to dictate words: no accents, no ambiguous or sensitive meaning.
const words = [
  "agua", "amigo", "anjo", "arco", "areia", "arvore", "aurora", "barco", "brisa", "campo", "canto", "casa",
  "cedro", "ceu", "chuva", "cidade", "colina", "cometa", "coral", "dia", "estrela", "farol", "festa", "flor",
  "folha", "fonte", "fruto", "galho", "graca", "guia", "horta", "ilha", "jardim", "lago", "lampada", "lapis",
  "lua", "luz", "manha", "mar", "mesa", "monte", "mundo", "nuvem", "oliva", "onda", "ouro", "pao", "paz",
  "pedra", "peixe", "pomar", "ponte", "porta", "praia", "prata", "rio", "rocha", "rosa", "semente", "sol",
  "tenda", "terra", "trigo", "trilha", "uva", "vale", "vento", "vida", "vinha", "vela", "barro", "caminho",
  "cesto", "fogo", "harpa", "livro", "mapa", "ninho", "palma", "pena", "pomba", "raiz", "selo", "sino",
  "tocha", "torre", "lirio", "cajado", "cantil", "lanterna", "mel", "orvalho", "pinheiro", "riacho",
];

// word-NNNN-word: ~26 bits from a CSPRNG, enough for a 7-day, rate-limited,
// single-use code, and still easy to read aloud or type on a phone.
export function generateAccessCode(random: (max: number) => number = randomInt) {
  const word = () => words[random(words.length)];
  return `${word()}-${String(random(10000)).padStart(4, "0")}-${word()}`;
}

// Accepts an e-mail or a quick-access username at the login screen.
export function loginEmail(identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (value.includes("@")) return z.email().safeParse(value).success ? value : null;
  return usernameSchema.safeParse(value).success ? quickAccessEmail(value) : null;
}

export function formatExpiry(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export function codeMessage(name: string, origin: string, username: string, code: string, expiresAt: string) {
  const login = new URL("/login", origin).toString();
  return `Olá! Este é o acesso de ${name} ao portal Sal da Terra.\n\nEntre em: ${login}\nUsuário: ${username}\nCódigo: ${code}\n\nNo primeiro acesso você vai criar sua própria senha. O código vale até ${formatExpiry(expiresAt)}. Depois, entre sempre com o usuário e a sua senha.\n\nO acesso é pessoal: não compartilhe.`;
}

export function quickAccessError(message: string) {
  if (message.includes("student_username_taken")) return "Este usuário já está em uso. Escolha outro.";
  if (message.includes("student_username_invalid")) return "Usuário inválido. Use letras sem acento, números e pontos.";
  if (message.includes("student_access_missing")) return "Este aluno não usa acesso por usuário. Use o link de acesso.";
  if (message.includes("student_access_exists")) return "Este adolescente já tem acesso. Atualize a página.";
  if (message.includes("student_access_inactive")) return "O cadastro ou o acesso está inativo. Reative antes de gerar o código.";
  if (message.includes("student_access_identity")) return "Este usuário já pertence a outra conta. Escolha outro.";
  if (message.includes("student_test_limit")) return "Já existem 3 alunos de teste ativos. Arquive um antes de criar outro.";
  if (message.includes("student_access_denied")) return "Apenas administradores do ministério podem gerenciar este acesso.";
  return "Não foi possível concluir. Tente novamente.";
}
