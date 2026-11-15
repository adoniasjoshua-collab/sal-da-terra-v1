import Link from "next/link";
import { formatarData, indicadoresRevista, numeroMissao, situacaoLabels, type Licao, type SituacaoLicaoEbd } from "@/services/revista";
import type { EbdSummary } from "@/services/dashboard-metrics";

const estiloSituacao: Record<SituacaoLicaoEbd, string> = {
  ministrada: "bg-[#e3f3ea] text-[#0f5137]",
  "aguardando-registro": "bg-amber-50 text-amber-900",
  "sem-registro": "bg-red-50 text-red-800",
  prevista: "bg-[#eef1ee] text-[#3f4d44]",
};

/** Dashboard block: Revista Gamificada lessons alongside the EBD attendance of the same Sunday. */
export function RevistaEbdIndicadores({ licoes, ebds, agora }: { licoes: Licao[]; ebds: EbdSummary[]; agora: Date }) {
  if (!licoes.length) return null;
  const ind = indicadoresRevista(licoes, ebds, agora);
  const hoje = ind.linhas.find((l) => l.status === "hoje");
  const cards = [
    { label: "Lições ministradas", value: `${ind.ministradas} de ${ind.total}`, detail: ind.semRegistro ? `${ind.semRegistro} domingo(s) sem EBD registrada` : "Com chamada de EBD registrada" },
    { label: "Comparecimento nas lições", value: ind.comparecimento === null ? "—" : `${ind.comparecimento}%`, detail: "Presentes ÷ (presentes + ausentes)" },
    { label: "Média de presentes", value: ind.mediaPresentes ?? "—", detail: "Por domingo da revista" },
  ];
  return <section className="card mt-6 p-5 sm:p-6" aria-labelledby="revista-ebd-title">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-xs font-black uppercase tracking-[.16em] text-[#4f46a5]">Revista Gamificada · 4º trimestre</p>
        <h2 id="revista-ebd-title" className="text-xl font-black">Lições e frequência da EBD</h2>
        <p className="mt-1 text-sm text-[#647268]">Cada lição usa a chamada da EBD do mesmo domingo. A frequência continua vindo só da chamada.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {hoje && <Link className="button-primary" href={`/conhecimento/revista/${hoje.numero}`}>Entrar na aula de hoje</Link>}
        <Link className="button-secondary" href="/conhecimento/revista">Abrir a trilha</Link>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((c) => <article className="rounded-xl border border-[#e7ece8] p-4" key={c.label}>
        <p className="text-sm font-semibold text-[#647268]">{c.label}</p>
        <p className="mt-1 text-2xl font-black tabular-nums">{c.value}</p>
        <p className="mt-1 text-xs text-[#647268]">{c.detail}</p>
      </article>)}
    </div>
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="text-xs uppercase tracking-[.08em] text-[#647268]">
          <tr><th className="py-2 pr-3">Lição</th><th className="py-2 pr-3">Domingo</th><th className="py-2 pr-3 text-right">Presentes</th><th className="py-2 pr-3 text-right">Comparecimento</th><th className="py-2">Situação</th></tr>
        </thead>
        <tbody className="divide-y divide-[#e7ece8]">
          {ind.linhas.map((l) => <tr key={l.numero}>
            <td className="py-3 pr-3"><span className="font-bold">Missão {numeroMissao(l.numero)}</span><span className="block text-xs text-[#647268]">{l.titulo}</span></td>
            <td className="py-3 pr-3 tabular-nums">{formatarData(l.data)}</td>
            <td className="py-3 pr-3 text-right tabular-nums">{l.ebd ? l.ebd.present : "—"}</td>
            <td className="py-3 pr-3 text-right tabular-nums">{l.ebd?.operationalRate != null ? `${l.ebd.operationalRate}%` : "—"}</td>
            <td className="py-3">
              {l.situacao === "aguardando-registro" || l.situacao === "sem-registro"
                ? <Link className={`badge ${estiloSituacao[l.situacao]} hover:underline`} href={l.situacao === "aguardando-registro" ? "/eventos/registrar" : "/eventos"}>{situacaoLabels[l.situacao]}</Link>
                : <span className={`badge ${estiloSituacao[l.situacao]}`}>{situacaoLabels[l.situacao]}</span>}
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
}

/** Banner on an EBD roll call: the magazine lesson of that Sunday. */
export function LicaoDoDomingo({ licao }: { licao: Licao | undefined }) {
  if (!licao || licao.placeholder) return null;
  return <p className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d9d6f5] bg-[#f3f2ff] p-4 text-sm text-[#2e2a7a]">
    <span>📖 <strong>Lição do dia:</strong> Missão {numeroMissao(licao.numero)}: {licao.titulo}</span>
    <Link className="button-secondary" href={`/conhecimento/revista/${licao.numero}`}>Abrir a aula</Link>
  </p>;
}
