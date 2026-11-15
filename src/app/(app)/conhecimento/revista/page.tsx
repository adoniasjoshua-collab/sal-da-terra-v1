import "@/features/revista/revista.css";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { RevistaSemAcesso } from "@/features/revista/access-denied";
import { carregarLicoes, verificarAcessoRevista } from "@/features/revista/data";
import { fontePergaminho } from "@/features/revista/fonts";
import { RevistaTrilha } from "@/features/revista/trail";

export const metadata: Metadata = { title: "Revista Gamificada" };

export default async function RevistaPage() {
  const acesso = await verificarAcessoRevista();
  if (!acesso.permitido) return <RevistaSemAcesso motivo={acesso.motivo} />;
  const licoes = await carregarLicoes();
  return <div className={fontePergaminho.variable}>
    <PageHeading eyebrow="Conhecimento · EBD Adolescentes" title="Revista Gamificada" description="Cada lição da revista Adolescer vira uma missão para jogar em sala, por times, aos domingos." />
    <RevistaTrilha licoes={licoes} agora={new Date()} podeConduzir={acesso.podeConduzir} />
  </div>;
}
