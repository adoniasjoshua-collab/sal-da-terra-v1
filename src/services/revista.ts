import { z } from "zod";

// Revista Gamificada — domain rules for the classroom lesson player.
// Lessons live in content/revista/licoes/*.json and are validated here; the UI
// never re-implements status, scoring or shuffling rules.

export const TRIMESTRE = "2026-t4";
export const FUSO_HORARIO = "America/Sao_Paulo";

export const cenarios = ["noite", "tesouro", "templo", "aurora", "arena"] as const;
export type Cenario = (typeof cenarios)[number];

const texto = z.string().trim().min(1);
const versiculo = z.object({ referencia: texto, texto: texto });
const professor = z.object({ tempo: texto.optional(), fala: texto.optional(), tecnica: texto.optional() }).strict();
const base = { cenario: z.enum(cenarios).optional(), professor: professor.optional() };

const capa = z.object({ ...base, tipo: z.literal("capa") }).strict();
const gancho = z.object({ ...base, tipo: z.literal("gancho"), pergunta: texto, revelacao: texto }).strict();
const memoria = z.object({
  ...base, tipo: z.literal("memoria"), titulo: texto,
  objetos: z.array(z.object({ emoji: texto, nome: texto, resposta: texto }).strict()).min(2),
  perguntas: z.array(z.object({ pergunta: texto, resposta: texto }).strict()).min(1),
  fechamento: texto.optional(),
}).strict();
const leitura = z.object({ leitor: z.number().int().positive().optional(), versiculos: z.array(versiculo).min(1) }).strict();
const pergaminho = z.object({
  ...base, tipo: z.literal("pergaminho"), titulo: texto.optional(),
  leituras: z.array(leitura).min(1), selo: texto.optional(), reflexao: texto.optional(),
}).strict();
const fase = z.object({
  ...base, tipo: z.literal("fase"), numero: z.number().int().positive().optional(), titulo: texto, gancho: texto.optional(),
  versiculo: versiculo.optional(),
  barras: z.array(z.object({ rotulo: texto, descricao: texto }).strict()).optional(),
  blocos: z.array(z.object({ titulo: texto, texto: texto }).strict()).default([]),
  destaque: texto.optional(), humor: texto.optional(),
}).strict();
const lado = z.object({ rotulo: texto, texto: texto }).strict();
const comparacao = z.object({ ...base, tipo: z.literal("comparacao"), titulo: texto.optional(), esquerda: lado, direita: lado }).strict();
const raioX = z.object({
  ...base, tipo: z.literal("raio-x"), titulo: texto, referencia: texto.optional(),
  areas: z.array(z.object({ rotulo: texto, descricao: texto }).strict()).min(1),
}).strict();
const powerUps = z.object({
  ...base, tipo: z.literal("power-ups"), titulo: texto,
  itens: z.array(z.object({ titulo: texto, texto: texto, referencia: texto.optional() }).strict()).min(1),
  espelho: texto.optional(),
}).strict();
const arena = z.object({ ...base, tipo: z.literal("arena"), titulo: texto, perguntas: z.array(texto).min(1) }).strict();
const quiz = z.object({
  ...base, tipo: z.literal("quiz"), titulo: texto,
  // Convention: the FIRST option is always the correct one; the player shuffles.
  perguntas: z.array(z.object({
    enunciado: texto, opcoes: z.array(texto).min(2).max(6),
    pontos: z.number().int().positive().max(50).default(10), bonus: z.boolean().default(false),
  }).strict()).min(1),
}).strict();
const missao = z.object({ ...base, tipo: z.literal("missao"), titulo: texto, tarefas: z.array(texto).min(1), recompensa: texto }).strict();
const encerramento = z.object({ ...base, tipo: z.literal("encerramento"), oracao: texto, teaser: texto }).strict();

export const telaSchema = z.discriminatedUnion("tipo", [capa, gancho, memoria, pergaminho, fase, comparacao, raioX, powerUps, arena, quiz, missao, encerramento]);
export type Tela = z.infer<typeof telaSchema>;
export type TipoTela = Tela["tipo"];

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD");
// Must carry an explicit offset (e.g. -03:00) so release time never depends on the server clock zone.
const dataHora = z.iso.datetime({ offset: true });

export const licaoSchema = z.object({
  numero: z.number().int().positive(),
  titulo: texto,
  data: dataIso,
  liberarEm: dataHora,
  placeholder: z.boolean().default(false),
  textoBiblico: texto.optional(),
  textoAureo: versiculo.optional(),
  objetivo: texto.optional(),
  verdadeAplicada: texto.optional(),
  telas: z.array(telaSchema).default([]),
}).strict().superRefine((licao, ctx) => {
  if (licao.placeholder) {
    if (licao.telas.length) ctx.addIssue({ code: "custom", path: ["telas"], message: "Placeholder não pode ter telas." });
    return;
  }
  if (!licao.telas.length) ctx.addIssue({ code: "custom", path: ["telas"], message: "Lição publicada precisa de telas." });
  if (!licao.textoAureo) ctx.addIssue({ code: "custom", path: ["textoAureo"], message: "Informe o texto áureo." });
  if (!licao.verdadeAplicada) ctx.addIssue({ code: "custom", path: ["verdadeAplicada"], message: "Informe a verdade aplicada." });
  if (licao.telas[0] && licao.telas[0].tipo !== "capa") ctx.addIssue({ code: "custom", path: ["telas", 0], message: "A primeira tela deve ser a capa." });
});
export type Licao = z.infer<typeof licaoSchema>;

export type StatusLicao = "concluida" | "hoje" | "liberada" | "bloqueada";
export const statusLabels: Record<StatusLicao, string> = { concluida: "Concluída", hoje: "Hoje", liberada: "Liberada", bloqueada: "Em breve" };

export function dataLocal(agora: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_HORARIO }).format(agora);
}

export function statusDaLicao(licao: Pick<Licao, "data" | "liberarEm" | "placeholder">, agora: Date): StatusLicao {
  if (licao.placeholder) return "bloqueada";
  const hoje = dataLocal(agora);
  if (licao.data === hoje) return "hoje";
  if (licao.data < hoje) return "concluida";
  return agora.getTime() >= new Date(licao.liberarEm).getTime() ? "liberada" : "bloqueada";
}

export const podeAbrir = (status: StatusLicao) => status !== "bloqueada";

/** Mission of the day: today's lesson, else the next released one, else the latest finished one. */
export function missaoEmDestaque<T extends { status: StatusLicao }>(licoes: T[]): T | null {
  return licoes.find((l) => l.status === "hoje")
    ?? licoes.find((l) => l.status === "liberada")
    ?? [...licoes].reverse().find((l) => l.status === "concluida")
    ?? null;
}

export function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}

export function formatarDataLonga(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}

export const numeroMissao = (numero: number) => String(numero).padStart(2, "0");

/** A screen without `cenario` inherits the previous one; the first defaults to the starry night. */
export function cenariosDasTelas(telas: Pick<Tela, "cenario">[]): Cenario[] {
  let atual: Cenario = "noite";
  return telas.map((tela) => (atual = tela.cenario ?? atual));
}

const rotulosTipo: Record<TipoTela, string> = {
  capa: "Capa", gancho: "Gancho", memoria: "Jogo da memória", pergaminho: "Leitura bíblica", fase: "Fase", comparacao: "Comparação",
  "raio-x": "Raio-X", "power-ups": "Power-ups", arena: "Arena", quiz: "Quiz", missao: "Missão da semana", encerramento: "Encerramento",
};
export function rotuloDaTela(tela: Tela): string {
  if (tela.tipo === "fase") return tela.numero ? `Fase ${tela.numero}: ${tela.titulo}` : tela.titulo;
  if ("titulo" in tela && tela.titulo) return `${rotulosTipo[tela.tipo]}: ${tela.titulo}`;
  return rotulosTipo[tela.tipo];
}

/** Students never receive the teacher's script. */
export function semRoteiroDoProfessor(licao: Licao): Licao {
  return { ...licao, telas: licao.telas.map((tela) => ({ ...tela, professor: undefined })) };
}

// ── Teams (never individual ranking) ─────────────────────────────────────────
export type Time = "sal" | "luz";
export type Placar = { sal: number; luz: number };
export const times: Record<Time, { nome: string; emoji: string }> = { sal: { nome: "Sal", emoji: "🧂" }, luz: { nome: "Luz", emoji: "💡" } };
export const placarVazio: Placar = { sal: 0, luz: 0 };

export function ajustarPlacar(placar: Placar, time: Time, delta: number): Placar {
  return { ...placar, [time]: Math.max(0, placar[time] + delta) };
}

export function somarPlacares(placares: Placar[]): Placar {
  return placares.reduce((total, p) => ({ sal: total.sal + p.sal, luz: total.luz + p.luz }), placarVazio);
}

/** Turns alternate Sal → Luz → Sal… by question index. */
export const timeDaVez = (indicePergunta: number): Time => (indicePergunta % 2 === 0 ? "sal" : "luz");

export type RespostaQuiz = { escolha: number; correta: boolean; time: Time; pontos: number };

/** Scores one answer: a hit gives the question's points to the team whose turn it is; a miss gives nothing. */
export function responderPergunta(pergunta: { pontos: number }, indicePergunta: number, escolha: number): RespostaQuiz {
  const correta = escolha === 0;
  return { escolha, correta, time: timeDaVez(indicePergunta), pontos: correta ? pergunta.pontos : 0 };
}

export function resultadoQuiz(respostas: (RespostaQuiz | null | undefined)[]) {
  const resultado = { sal: { acertos: 0, pontos: 0 }, luz: { acertos: 0, pontos: 0 } };
  for (const r of respostas) if (r?.correta) { resultado[r.time].acertos += 1; resultado[r.time].pontos += r.pontos; }
  return resultado;
}

/** Deterministic shuffle (same order on server, client and after reload). Returns original option indices. */
export function ordemEmbaralhada(total: number, semente: string): number[] {
  let h = 2166136261;
  for (const c of semente) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const proximo = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  const ordem = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i -= 1) { const j = Math.floor(proximo() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]]; }
  return ordem;
}

// ── Local persistence shape (projector device only; no personal data) ───────
export const chavePlacar = `revista:${TRIMESTRE}:placar`;
export const chaveProgresso = (numero: number) => `revista:${TRIMESTRE}:licao-${numero}`;

const placarSchema = z.object({ sal: z.number().int().min(0), luz: z.number().int().min(0) });
const placaresSchema = z.record(z.string().regex(/^\d+$/), placarSchema);
const progressoSchema = z.object({
  tela: z.number().int().min(0),
  quiz: z.record(z.string(), z.array(z.object({ escolha: z.number().int().min(0), correta: z.boolean(), time: z.enum(["sal", "luz"]), pontos: z.number().int().min(0) }).nullable())).default({}),
});
export type Placares = z.infer<typeof placaresSchema>;
export type Progresso = z.infer<typeof progressoSchema>;

function lerJson<T>(raw: string | null, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try { const parsed = schema.safeParse(JSON.parse(raw)); return parsed.success ? parsed.data : fallback; } catch { return fallback; }
}
export const lerPlacares = (raw: string | null): Placares => lerJson(raw, placaresSchema, {});
export const lerProgresso = (raw: string | null): Progresso => lerJson(raw, progressoSchema, { tela: 0, quiz: {} });
