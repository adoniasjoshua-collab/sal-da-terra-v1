import { RADAR_LABELS, type RadarStatus } from "@/services/pastoral-radar";
const styles: Record<RadarStatus, string> = { active: "bg-emerald-50 text-emerald-700", attention: "bg-amber-50 text-amber-800", follow_up: "bg-orange-50 text-orange-800", priority: "bg-red-50 text-red-700", inactive: "bg-slate-100 text-slate-600" };
export function StatusBadge({ status }: { status: RadarStatus }) { return <span className={`badge ${styles[status]}`}>{RADAR_LABELS[status]}</span>; }
