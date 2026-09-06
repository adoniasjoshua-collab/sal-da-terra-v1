export type RadarStatus = "active" | "attention" | "follow_up" | "priority" | "inactive";
export const RADAR_THRESHOLDS = Object.freeze({ attention: 2, followUp: 3, priority: 4 });

export function getRadarStatus(consecutiveAbsences: number, isActive = true): RadarStatus {
  if (!isActive) return "inactive";
  if (consecutiveAbsences >= RADAR_THRESHOLDS.priority) return "priority";
  if (consecutiveAbsences >= RADAR_THRESHOLDS.followUp) return "follow_up";
  if (consecutiveAbsences >= RADAR_THRESHOLDS.attention) return "attention";
  return "active";
}

export const RADAR_LABELS: Record<RadarStatus, string> = {
  active: "Ativo", attention: "Atenção", follow_up: "Acompanhamento", priority: "Prioridade", inactive: "Inativo",
};
