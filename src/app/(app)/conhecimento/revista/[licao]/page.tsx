import "@/features/revista/revista.css";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RevistaSemAcesso } from "@/features/revista/access-denied";
import { carregarLicoes, verificarAcessoRevista } from "@/features/revista/data";
import { fontesRevista } from "@/features/revista/fonts";
import { RevistaPlayer } from "@/features/revista/player";
import { formatarData, licaoAnterior, numeroMissao, podeAbrir, semRoteiroDoProfessor, statusDaLicao } from "@/services/revista";

export const metadata: Metadata = { title: "Aula · Revista Gamificada" };

export default async function LicaoPage({ params }: { params: Promise<{ licao: string }> }) {
  const { licao: segmento } = await params;
  if (!/^\d{1,3}$/.test(segmento)) notFound();
  const acesso = await verificarAcessoRevista();
  if (!acesso.permitido) return <RevistaSemAcesso motivo={acesso.motivo} />;
  const licoes = await carregarLicoes();
  const licao = licoes.find((l) => l.numero === Number(segmento));
  if (!licao) notFound();

  if (!podeAbrir(statusDaLicao(licao, new Date())) || !licao.telas.length) {
    return <section className="card p-6">
      <p className="text-4xl" aria-hidden="true">🔒</p>
      <h1 className="mt-2 text-2xl font-black">Missão {numeroMissao(licao.numero)}: em breve</h1>
      <p className="mt-3 leading-7">Esta aula de {formatarData(licao.data)} ainda não foi liberada. Volte mais perto do domingo.</p>
      <Link className="button-secondary mt-4" href="/conhecimento/revista">Voltar à trilha</Link>
    </section>;
  }

  // The teacher's script never leaves the server for students.
  const dados = acesso.podeConduzir ? licao : semRoteiroDoProfessor(licao);
  const anterior = acesso.podeConduzir ? licaoAnterior(licoes, licao) : null;
  return <div className={fontesRevista}><RevistaPlayer licao={dados} podeConduzir={acesso.podeConduzir} anterior={anterior && { numero: anterior.numero, titulo: anterior.titulo }} /></div>;
}
