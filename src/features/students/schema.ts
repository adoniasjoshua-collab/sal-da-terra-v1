import { z } from "zod";

const optionalText = z.string().trim().transform((value) => value || null);
export const studentSchema = z.object({
  full_name: z.string().trim().min(2).max(160), preferred_name: optionalText,
  birth_date: z.iso.date(), gender: optionalText, phone: optionalText,
  guardian_name: z.string().trim().min(2).max(160), guardian_phone: z.string().trim().min(8).max(30),
  guardian_relationship: z.string().trim().min(2).max(60), joined_at: z.iso.date(), notes: optionalText,
  // Archiving has a dedicated action so archived_at and is_active remain consistent.
  status: z.enum(["active", "inactive", "visitor"]),
});

export function studentFromForm(formData: FormData) {
  return studentSchema.safeParse(Object.fromEntries(formData));
}
