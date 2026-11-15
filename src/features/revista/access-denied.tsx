import Link from "next/link";

export function RevistaSemAcesso({ motivo }: { motivo: "sem-inscricao" | "indisponivel" }) {
  return <section className="card p-6">
    <h1 className="text-2xl font-black">{motivo === "indisponivel" ? "Não foi possível abrir a revista agora" : "A Revista Gamificada é para alunos inscritos"}</h1>
    <p className="mt-3 leading-7">{motivo === "indisponivel" ? "Tente novamente em alguns minutos." : "Seu acesso ao Portal de Conhecimento ainda não foi liberado. Converse com a liderança."}</p>
    <Link className="button-secondary mt-4" href="/conhecimento">Voltar ao Conhecimento</Link>
  </section>;
}
