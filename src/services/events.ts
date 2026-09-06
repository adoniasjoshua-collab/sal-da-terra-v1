export const EVENT_TYPE_OPTIONS = [
  { value: "EBD", label: "Escola Bíblica Dominical", mode: "full_roster" },
  { value: "worship", label: "Culto", mode: "participation_only" },
  { value: "evangelism", label: "Evangelismo", mode: "participation_only" },
  { value: "volunteer_action", label: "Ação voluntária/social", mode: "participation_only" },
  { value: "rehearsal", label: "Ensaio", mode: "participation_only" },
  { value: "meeting", label: "Reunião de adolescentes", mode: "participation_only" },
  { value: "congress", label: "Congresso ou conferência", mode: "participation_only" },
  { value: "retreat", label: "Retiro ou acampamento", mode: "participation_only" },
  { value: "outing", label: "Passeio ou confraternização", mode: "participation_only" },
] as const;

export type EventType = (typeof EVENT_TYPE_OPTIONS)[number]["value"];
export type AttendanceMode = "full_roster" | "participation_only";
export type ParticipationStatus = "present" | "absent" | "justified" | "visitor" | "not_participated";

export const EVENT_TYPE_VALUES = EVENT_TYPE_OPTIONS.map((option) => option.value) as [EventType, ...EventType[]];
export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EventType, string>;

export function defaultAttendanceMode(type: EventType): AttendanceMode {
  return EVENT_TYPE_OPTIONS.find((option) => option.value === type)?.mode ?? "participation_only";
}

export function isAttendanceStatusAllowed(mode: AttendanceMode, status: ParticipationStatus): boolean {
  if (mode === "full_roster") return status !== "not_participated";
  return status !== "absent" && status !== "justified";
}
