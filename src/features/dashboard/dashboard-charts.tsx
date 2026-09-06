import { formatDate } from "@/lib/format";
import type { EbdSummary } from "@/services/dashboard-metrics";
import { RADAR_LABELS, type RadarStatus } from "@/services/pastoral-radar";
import { EVENT_TYPE_LABELS } from "@/services/events";
import type { EventCategoryMetric } from "@/services/event-dashboard";

const attendancePalette = {
  present: { label: "Presentes", color: "#2f855a" },
  absent: { label: "Ausentes", color: "#c0564a" },
  justified: { label: "Justificados", color: "#d69e2e" },
  visitor: { label: "Visitantes", color: "#3f7cac" },
} as const;

const radarPalette: Record<RadarStatus, string> = {
  active: "#2f855a",
  attention: "#d69e2e",
  follow_up: "#c2762e",
  priority: "#b5473c",
  inactive: "#829087",
};

export function AttendanceLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#526158]" aria-label="Legenda">
      {Object.entries(attendancePalette).map(([key, item]) => (
        <li className="flex items-center gap-1.5" key={key}><span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />{item.label}</li>
      ))}
    </ul>
  );
}

export function EbdTrendChart({ summaries }: { summaries: EbdSummary[] }) {
  if (summaries.length === 0) return <p className="py-10 text-center text-sm text-[#647268]">Registre e conclua uma EBD para visualizar a evolução.</p>;

  const chronological = [...summaries].reverse();
  const maxTotal = Math.max(...chronological.map((item) => item.present + item.absent + item.justified + item.visitor), 1);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#647268]">Quantidade registrada por domingo · até 12 EBDs</p>
        <AttendanceLegend />
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid items-end gap-2 border-b border-[#cbd6cd] px-2 pt-8" style={{ height: 260, minWidth: Math.max(chronological.length * 64, 320), gridTemplateColumns: `repeat(${chronological.length}, minmax(46px, 1fr))` }}>
          {chronological.map((item) => {
            const total = item.present + item.absent + item.justified + item.visitor;
            const segments = ["present", "absent", "justified", "visitor"] as const;
            const label = `${formatDate(item.date)}: ${item.present} presentes, ${item.absent} ausentes, ${item.justified} justificados e ${item.visitor} visitantes`;
            return (
              <div className="flex h-full min-w-0 flex-col items-center justify-end" key={item.id} title={label}>
                <span className="mb-2 text-xs font-black text-[#304339]">{item.operationalRate === null ? "—" : `${item.operationalRate}%`}</span>
                <div className="flex w-full max-w-11 flex-col-reverse overflow-hidden rounded-t-md border border-[#d7dfd8] bg-[#edf1ed]" role="img" aria-label={label} style={{ height: `${Math.max((total / maxTotal) * 168, total ? 12 : 2)}px` }}>
                  {segments.map((status) => item[status] > 0 && <span key={status} style={{ backgroundColor: attendancePalette[status].color, height: `${(item[status] / total) * 100}%` }} />)}
                </div>
                <time className="mt-2 text-[11px] font-bold text-[#526158]" dateTime={item.date}>{item.date.slice(5).split("-").reverse().join("/")}</time>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LastEbdDonut({ summary }: { summary?: EbdSummary }) {
  if (!summary) return <p className="py-10 text-center text-sm text-[#647268]">Nenhuma EBD concluída.</p>;

  const statuses = ["present", "absent", "justified", "visitor"] as const;
  const total = statuses.reduce((sum, status) => sum + summary[status], 0);
  let offset = 0;

  return (
    <div>
      <p className="text-sm text-[#647268]">Resultado de {formatDate(summary.date)}</p>
      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
        <div className="relative mx-auto size-36">
          <svg className="size-36 -rotate-90" viewBox="0 0 42 42" role="img" aria-label={`Composição da última EBD, ${total} registros`}>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#edf1ed" strokeWidth="5" />
            {total > 0 && statuses.map((status) => {
              const percentage = (summary[status] / total) * 100;
              const dashOffset = -offset;
              offset += percentage;
              return <circle key={status} cx="21" cy="21" r="15.9" fill="none" pathLength="100" stroke={attendancePalette[status].color} strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={dashOffset} strokeWidth="5" />;
            })}
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center"><strong className="text-2xl font-black">{summary.operationalRate === null ? "—" : `${summary.operationalRate}%`}</strong><span className="text-[10px] text-[#647268]">comparecimento</span></div>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          {statuses.map((status) => <div className="rounded-xl bg-[#f5f7f3] p-2.5" key={status}><dt className="flex items-center gap-1.5 text-[11px] text-[#647268]"><span className="size-2 rounded-sm" style={{ backgroundColor: attendancePalette[status].color }} />{attendancePalette[status].label}</dt><dd className="mt-1 text-lg font-black">{summary[status]}</dd></div>)}
        </dl>
      </div>
    </div>
  );
}

export function RadarDistribution({ counts }: { counts: Record<RadarStatus, number> }) {
  const order: RadarStatus[] = ["active", "attention", "follow_up", "priority", "inactive"];
  const max = Math.max(...order.map((status) => counts[status]), 1);

  return (
    <div className="mt-5 space-y-4">
      {order.map((status) => (
        <div key={status}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{RADAR_LABELS[status]}</span><span className="font-black tabular-nums">{counts[status]}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-[#edf1ed]" role="img" aria-label={`${RADAR_LABELS[status]}: ${counts[status]} adolescentes`}><div className="h-full rounded-full" style={{ backgroundColor: radarPalette[status], width: `${(counts[status] / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function EventParticipationChart({ categories }: { categories: EventCategoryMetric[] }) {
  if (categories.length === 0) return <p className="py-10 text-center text-sm text-[#647268]">Conclua eventos não EBD para visualizar a participação por categoria.</p>;
  const max = Math.max(...categories.map((item) => item.participations), 1);

  return (
    <div className="mt-5 space-y-5">
      {categories.map((item) => (
        <div key={item.type}>
          <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-sm font-bold">{EVENT_TYPE_LABELS[item.type]}</p><p className="text-xs text-[#647268]">{item.eventCount} {item.eventCount === 1 ? "evento" : "eventos"} · média {(item.participations / item.eventCount).toFixed(1).replace(".", ",")}</p></div>
            <p className="text-sm font-black tabular-nums">{item.participations} participações</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#edf1ed]" role="img" aria-label={`${EVENT_TYPE_LABELS[item.type]}: ${item.participations} participações em ${item.eventCount} eventos`}><div className="h-full rounded-full bg-[#3f7cac]" style={{ width: `${(item.participations / max) * 100}%` }} /></div>
          <p className="mt-1.5 text-[11px] text-[#647268]">{item.identifiedEventCount > 0 ? `${item.identifiedUnique} pessoas únicas em ${item.identifiedEventCount} eventos identificados` : "Sem identificação nominal"}{item.aggregateEventCount > 0 ? ` · ${item.aggregateEventCount} por quantidade` : ""}</p>
        </div>
      ))}
    </div>
  );
}
