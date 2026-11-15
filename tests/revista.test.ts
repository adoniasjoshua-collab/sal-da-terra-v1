import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ajustarPlacar, cenariosDasTelas, lerPlacares, lerProgresso, licaoSchema, missaoEmDestaque, ordemEmbaralhada,
  responderPergunta, resultadoQuiz, semRoteiroDoProfessor, somarPlacares, statusDaLicao, timeDaVez,
} from "../src/services/revista";

const pasta = path.join(process.cwd(), "content", "revista", "licoes");
const arquivos = readdirSync(pasta).filter((n) => /^licao-\d{2,3}\.json$/.test(n));
const ler = (arquivo: string) => JSON.parse(readFileSync(path.join(pasta, arquivo), "utf8"));

describe("arquivos de lição", () => {
  it.each(arquivos)("%s segue o schema", (arquivo) => {
    const parsed = licaoSchema.safeParse(ler(arquivo));
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    expect(parsed.data?.numero).toBe(Number(arquivo.match(/\d+/)![0]));
  });

  it("o modelo também é válido", () => {
    expect(licaoSchema.safeParse(ler("_modelo/licao-modelo.json")).success).toBe(true);
  });

  it("cadastra as lições 7 a 13, com 8–13 como placeholders sem conteúdo", () => {
    const licoes = arquivos.map((a) => licaoSchema.parse(ler(a)));
    expect(licoes.map((l) => l.numero)).toEqual([7, 8, 9, 10, 11, 12, 13]);
    expect(licoes.filter((l) => l.placeholder).map((l) => l.numero)).toEqual([8, 9, 10, 11, 12, 13]);
    expect(licoes.filter((l) => l.placeholder).every((l) => l.telas.length === 0)).toBe(true);
  });

  it("a Lição 7 tem as 16 telas na ordem do roteiro", () => {
    const licao = licaoSchema.parse(ler("licao-07.json"));
    expect(licao.telas.map((t) => t.tipo)).toEqual([
      "capa", "gancho", "memoria", "pergaminho", "pergaminho", "fase", "comparacao", "pergaminho",
      "fase", "raio-x", "power-ups", "pergaminho", "arena", "quiz", "missao", "encerramento",
    ]);
    const quiz = licao.telas.find((t) => t.tipo === "quiz");
    expect(quiz?.tipo === "quiz" && quiz.perguntas.map((p) => p.pontos)).toEqual([10, 10, 10, 10, 10, 10, 10, 10, 10, 20]);
  });

  it("rejeita lição sem capa, sem fuso no liberarEm ou placeholder com telas", () => {
    const base = ler("licao-07.json");
    expect(licaoSchema.safeParse({ ...base, telas: base.telas.slice(1) }).success).toBe(false);
    expect(licaoSchema.safeParse({ ...base, liberarEm: "2026-11-09T08:00:00" }).success).toBe(false);
    expect(licaoSchema.safeParse({ ...base, placeholder: true }).success).toBe(false);
  });
});

describe("status da trilha", () => {
  const licao = { data: "2026-11-22", liberarEm: "2026-11-16T08:00:00-03:00", placeholder: false };
  it("bloqueada antes de liberarEm, liberada depois, hoje no domingo e concluída depois", () => {
    expect(statusDaLicao(licao, new Date("2026-11-16T07:59:00-03:00"))).toBe("bloqueada");
    expect(statusDaLicao(licao, new Date("2026-11-16T08:00:00-03:00"))).toBe("liberada");
    expect(statusDaLicao(licao, new Date("2026-11-22T00:30:00-03:00"))).toBe("hoje");
    expect(statusDaLicao(licao, new Date("2026-11-22T23:59:00-03:00"))).toBe("hoje");
    expect(statusDaLicao(licao, new Date("2026-11-23T00:01:00-03:00"))).toBe("concluida");
  });
  it("usa o fuso de São Paulo, não o UTC", () => {
    // 22/11 01:00 UTC is still 21/11 in Brazil.
    expect(statusDaLicao(licao, new Date("2026-11-22T01:00:00Z"))).toBe("liberada");
  });
  it("placeholder fica bloqueado mesmo depois da data", () => {
    expect(statusDaLicao({ ...licao, placeholder: true }, new Date("2026-12-30T12:00:00-03:00"))).toBe("bloqueada");
  });
  it("em 15/11/2026 a Lição 7 é hoje e as demais estão bloqueadas", () => {
    const agora = new Date("2026-11-15T09:00:00-03:00");
    const status = arquivos.map((a) => statusDaLicao(licaoSchema.parse(ler(a)), agora));
    expect(status).toEqual(["hoje", "bloqueada", "bloqueada", "bloqueada", "bloqueada", "bloqueada", "bloqueada"]);
  });
  it("destaca hoje, depois a próxima liberada, depois a última concluída", () => {
    expect(missaoEmDestaque([{ n: 1, status: "concluida" as const }, { n: 2, status: "hoje" as const }])?.n).toBe(2);
    expect(missaoEmDestaque([{ n: 1, status: "concluida" as const }, { n: 2, status: "liberada" as const }])?.n).toBe(2);
    expect(missaoEmDestaque([{ n: 1, status: "concluida" as const }, { n: 2, status: "concluida" as const }, { n: 3, status: "bloqueada" as const }])?.n).toBe(2);
    expect(missaoEmDestaque([{ n: 3, status: "bloqueada" as const }])).toBeNull();
  });
});

describe("quiz e placar por times", () => {
  it("alterna a vez Sal, Luz, Sal…", () => {
    expect([0, 1, 2, 3].map(timeDaVez)).toEqual(["sal", "luz", "sal", "luz"]);
  });
  it("acerto vale os pontos da pergunta para o time da vez; erro vale zero", () => {
    expect(responderPergunta({ pontos: 10 }, 0, 0)).toEqual({ escolha: 0, correta: true, time: "sal", pontos: 10 });
    expect(responderPergunta({ pontos: 20 }, 9, 0)).toEqual({ escolha: 0, correta: true, time: "luz", pontos: 20 });
    expect(responderPergunta({ pontos: 10 }, 1, 2)).toEqual({ escolha: 2, correta: false, time: "luz", pontos: 0 });
  });
  it("resume o resultado por time", () => {
    const r = resultadoQuiz([responderPergunta({ pontos: 10 }, 0, 0), responderPergunta({ pontos: 10 }, 1, 1), null, responderPergunta({ pontos: 20 }, 3, 0)]);
    expect(r).toEqual({ sal: { acertos: 1, pontos: 10 }, luz: { acertos: 1, pontos: 20 } });
  });
  it("placar nunca fica negativo e soma o trimestre", () => {
    expect(ajustarPlacar({ sal: 5, luz: 0 }, "sal", -10)).toEqual({ sal: 0, luz: 0 });
    expect(somarPlacares([{ sal: 10, luz: 20 }, { sal: 30, luz: 0 }])).toEqual({ sal: 40, luz: 20 });
  });
  it("embaralha de forma estável e sem perder alternativas", () => {
    const a = ordemEmbaralhada(4, "licao-7:tela-13:0");
    expect(a).toEqual(ordemEmbaralhada(4, "licao-7:tela-13:0"));
    expect([...a].sort()).toEqual([0, 1, 2, 3]);
    const firsts = new Set(Array.from({ length: 10 }, (_, i) => ordemEmbaralhada(4, `s:${i}`)[0]));
    expect(firsts.size).toBeGreaterThan(1); // the correct answer is not always shown first
  });
  it("ignora armazenamento corrompido", () => {
    expect(lerPlacares("{oops")).toEqual({});
    expect(lerPlacares(JSON.stringify({ 7: { sal: -3, luz: 1 } }))).toEqual({});
    expect(lerProgresso(null)).toEqual({ tela: 0, quiz: {} });
    expect(lerProgresso(JSON.stringify({ tela: 4 }))).toEqual({ tela: 4, quiz: {} });
  });
});

describe("conteúdo para alunos", () => {
  it("remove o roteiro do professor de todas as telas", () => {
    const licao = semRoteiroDoProfessor(licaoSchema.parse(ler("licao-07.json")));
    expect(licao.telas.every((t) => t.professor === undefined)).toBe(true);
    expect(JSON.stringify(licao)).not.toContain("\"professor\"");
  });
  it("cenário sem valor herda o anterior", () => {
    expect(cenariosDasTelas([{ cenario: undefined }, { cenario: "tesouro" }, { cenario: undefined }])).toEqual(["noite", "tesouro", "tesouro"]);
  });
});
