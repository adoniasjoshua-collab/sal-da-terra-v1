import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "student" | "leader" | "admin";
export type AuthContext = { userId: string; ministryId: string; ministryName: string; role: AppRole; name: string };

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  const { data: membership } = await supabase.from("ministry_members").select("ministry_id, role, ministries(name)").eq("profile_id", userId).eq("is_active", true).limit(1).single();
  if (!membership) redirect("/acesso-negado");
  const ministry = membership.ministries as unknown as { name: string } | null;
  return { userId, ministryId: membership.ministry_id, ministryName: ministry?.name ?? "Ministério", role: membership.role as AppRole, name: profile?.full_name ?? "Usuário" };
}

export async function requireStaff() {
  const context = await requireAuth();
  if (context.role === "student") redirect("/minha-participacao");
  return context;
}
