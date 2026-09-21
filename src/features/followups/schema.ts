import { z } from "zod";

export const followupSchema = z.object({
  student_id: z.uuid(),
  followup_type: z.enum(["conversation", "phone_call", "whatsapp", "family_contact", "visit", "prayer", "other"]),
  occurred_at: z.iso.datetime({ local: true, precision: -1 }).regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  summary: z.string().trim().min(2).max(2000),
  next_action: z.string().trim().max(500).optional(),
  next_action_date: z.union([z.literal(""), z.iso.date()]).optional(),
  is_sensitive: z.enum(["on"]).optional(),
  status: z.enum(["open", "completed", "cancelled"]),
});

export function followupValues(data: z.infer<typeof followupSchema>) {
  return {
    followup_type: data.followup_type,
    occurred_at: new Date(`${data.occurred_at}:00-03:00`).toISOString(),
    summary: data.summary,
    next_action: data.next_action || null,
    next_action_date: data.next_action_date || null,
    is_sensitive: data.is_sensitive === "on",
    status: data.status,
  };
}
