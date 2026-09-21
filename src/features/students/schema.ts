import { z } from "zod";

const optionalText = z.string().trim().transform((value) => value || null);
export const studentSchema = z.object({
  full_name: z.string().trim().min(2).max(160), preferred_name: optionalText,
  birth_date: z.iso.date(), gender: optionalText, phone: optionalText,
  guardian_name: z.string().trim().min(2).max(160), guardian_phone: z.string().trim().min(8).max(30),
  guardian_relationship: z.string().trim().min(2).max(60), joined_at: z.iso.date(), notes: optionalText,
  // New registrations start unarchived; edits maintain lifecycle fields together.
  status: z.enum(["active", "inactive", "visitor"]),
});

export const studentUpdateSchema = studentSchema.extend({
  status: z.enum(["active", "inactive", "visitor", "archived"]),
});

export function studentFromForm(formData: FormData, editing = false) {
  return studentUpdateSchema.refine((data) => editing || data.status !== "archived")
    .safeParse(Object.fromEntries(formData));
}
