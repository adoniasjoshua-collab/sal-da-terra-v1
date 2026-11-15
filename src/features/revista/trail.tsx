import Link from "next/link";
import { formatarData, formatarDataLonga, missaoEmDestaque, numeroMissao, podeAbrir, statusDaLicao, statusLabels, type Licao, type StatusLicao } from "@/services/revista";
import { PlacarTrimestre } from "./placar-trimestre";

const iconeStatus: Record<StatusLicao, string> = { concluida: "✔", hoje: "★", liberada: "▶", bloqueada: "🔒" };

export function RevistaTrilha({ licoes, agora, podeConduzir }: { licoes: Licao[]; agora: Date; podeConduzir: boolean }) {
  const comStatus = licoes.map((licao) => ({ licao, status: statusDaLicao(licao, agora) }));
  const destaque = missaoEmDestaque(comStatus);

  return <div className="rv-trilha-pagina">
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <section className="rv-destaque-card" aria-labelledby="missao-dia">
        {destaque ? <>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#f5d77a]">
            {destaque.status === "hoje" ? "Missão do dia" : destaque.status === "liberada" ? "Próxima missão · estudo prévio" : "Última missão"}
          </p>
          <h2 id="missao-dia" className="mt-2 text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-black leading-tight">
            Missão {numeroMissao(destaque.licao.numero)}: {destaque.licao.titulo}
          </h2>
          <p className="mt-2 capitalize text-white/85">{formatarDataLonga(destaque.licao.data)}</p>
          {destaque.licao.textoAureo && <p className="rv-fonte-pergaminho mt-4 max-w-2xl text-xl italic leading-8 text-white/95">“{destaque.licao.textoAureo.texto}” <span className="not-italic text-[#f5d77a]">({destaque.licao.textoAureo.referencia})</span></p>}
          <Link className="rv-botao rv-botao-destaque mt-6" href={`/conhecimento/revista/${destaque.licao.numero}`}>Entrar na aula →</Link>
        </> : <>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#f5d77a]">Em breve</p>
          <h2 id="missao-dia" className="mt-2 text-3xl font-black">A próxima missão ainda não foi liberada</h2>
        </>}
      </section>
      {podeConduzir ? <PlacarTrimestre /> : <section className="rv-placar-trimestre"><h2 className="text-xs font-black uppercase tracking-[.16em] text-[#f5d77a]">Times Sal 🧂 e Luz 💡</h2><p className="mt-3 text-sm leading-6 text-white/90">Na sala, a turma joga em dois times (Mt 5.13-14). Aqui você pode estudar as missões liberadas antes do domingo.</p></section>}
    </div>

    <section className="mt-8" aria-labelledby="trilha-titulo">
      <h2 id="trilha-titulo" className="text-xl font-black">Trilha do 4º trimestre</h2>
      <ol className="rv-trilha mt-4">
        {comStatus.map(({ licao, status }, i) => {
          const conteudo = <>
            <span className={`rv-no rv-no-${status}`} aria-hidden="true">{iconeStatus[status]}</span>
            <span className="min-w-0">
              <span className="block text-xs font-black uppercase tracking-[.12em] text-[#526158]">Lição {licao.numero} · {formatarData(licao.data)}</span>
              <span className="block font-black text-[#17231d]">{status === "bloqueada" ? "Em breve" : licao.titulo}</span>
              <span className={`badge mt-1 rv-badge-${status}`}>{statusLabels[status]}</span>
            </span>
          </>;
          return <li key={licao.numero} className={`rv-trilha-item ${i % 2 ? "rv-trilha-direita" : ""}`}>
            {podeAbrir(status)
              ? <Link className="rv-trilha-cartao" href={`/conhecimento/revista/${licao.numero}`} aria-label={`Lição ${licao.numero}: ${licao.titulo}, ${statusLabels[status]}`}>{conteudo}</Link>
              : <div className="rv-trilha-cartao rv-trilha-bloqueada" aria-label={`Lição ${licao.numero}, em breve`}>{conteudo}</div>}
          </li>;
        })}
      </ol>
    </section>
  </div>;
}
