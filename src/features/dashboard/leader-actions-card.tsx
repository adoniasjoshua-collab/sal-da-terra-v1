import Link from "next/link";
import type { LeaderAction, LeaderActionTone } from "@/services/leader-actions";

const TONE_STYLE: Record<LeaderActionTone, string> = {
  high: "bg-red-50 text-red-800",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-blue-50 text-blue-800",
  positive: "bg-emerald-50 text-emerald-800",
};

export function LeaderActionsCard({ items, total }: { items: LeaderAction[]; total: number }) {
  return (
    <section className="card mt-6 p-5 sm:p-6" aria-labelledby="leader-actions-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="leader-actions-title" className="text-xl font-black">Ações da semana</h2>
          <p className="mt-1 text-sm text-[#647268]">Sugestões automáticas a partir da presença na EBD. Registrar um acompanhamento no perfil tira o aluno desta lista por 7 dias.</p>
        </div>
        {total > items.length && <span className="badge bg-[#edf1ed] text-[#304339]">Mostrando {items.length} de {total}</span>}
      </div>
      {items.length === 0 ? <p className="py-8 text-center text-sm text-[#647268]">Nenhuma ação sugerida agora. Bom trabalho!</p> : (
        <ul className="mt-4 divide-y divide-[#e7ece8]">
          {items.map((item) => (
            <li className="flex flex-wrap items-start justify-between gap-3 py-4" key={item.key}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className={`badge ${TONE_STYLE[item.tone]}`}>{item.label}</span><span className="font-bold">{item.title}</span></div>
                <p className="mt-1 text-xs text-[#647268]">{item.detail}</p>
                <p className="mt-2 text-sm">{item.action}</p>
              </div>
              <Link href={item.href} className="button-secondary">Abrir</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
