import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { requireAuth, type AuthContext } from "@/lib/auth";
import { getLearningSnapshot } from "@/features/learning/data";
import { licaoSchema, type Licao } from "@/services/revista";

// Lesson files are editorial data shipped with the app (see content/revista/README.md).
const PASTA_LICOES = path.join(process.cwd(), "content", "revista", "licoes");
export const ARQUIVO_LICAO = /^licao-(\d{2,3})\.json$/;

export const carregarLicoes = cache(async (): Promise<Licao[]> => {
  const arquivos = (await readdir(PASTA_LICOES)).filter((nome) => ARQUIVO_LICAO.test(nome));
  const licoes: Licao[] = [];
  for (const arquivo of arquivos) {
    let bruto: unknown;
    try { bruto = JSON.parse(await readFile(path.join(PASTA_LICOES, arquivo), "utf8")); } catch (erro) {
      console.error(`[revista] ${arquivo} não é um JSON válido e foi ignorado`, erro);
      continue;
    }
    const parsed = licaoSchema.safeParse(bruto);
    if (parsed.success) licoes.push(parsed.data);
    else console.error(`[revista] ${arquivo} inválido e ignorado`, parsed.error.issues);
  }
  return licoes.sort((a, b) => a.numero - b.numero);
});

export type AcessoRevista =
  | { permitido: true; actor: AuthContext; podeConduzir: boolean }
  | { permitido: false; actor: AuthContext; motivo: "sem-inscricao" | "indisponivel" };

/** Leaders/admins always; students only with an active enrollment in the knowledge portal. */
export async function verificarAcessoRevista(): Promise<AcessoRevista> {
  const actor = await requireAuth();
  if (actor.role !== "student") return { permitido: true, actor, podeConduzir: true };
  const { data, error } = await getLearningSnapshot(actor.ministryId);
  if (error) return { permitido: false, actor, motivo: "indisponivel" };
  if (!data?.enrollment?.is_active) return { permitido: false, actor, motivo: "sem-inscricao" };
  return { permitido: true, actor, podeConduzir: false };
}
