"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
const schema=z.object({id:z.uuid(),role:z.enum(["student","leader","admin"]),is_active:z.enum(["true","false"])});
export async function updateMembership(formData:FormData){const actor=await requireAuth();if(actor.role!=="admin")return;const parsed=schema.safeParse(Object.fromEntries(formData));if(!parsed.success)return;const supabase=await createClient();await supabase.from("ministry_members").update({role:parsed.data.role,is_active:parsed.data.is_active==="true"}).eq("id",parsed.data.id).eq("ministry_id",actor.ministryId);revalidatePath("/administracao")}
