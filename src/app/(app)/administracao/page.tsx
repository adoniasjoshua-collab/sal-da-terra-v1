import { redirect } from "next/navigation";
import { MembershipForm } from "@/features/admin/membership-form";
import { PageHeading } from "@/components/page-heading";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

type SearchParams = Promise<{ search?: string; role?: string; access?: string }>;
type Member = { id: string; profile_id: string; role: MemberRole; is_active: boolean; profiles: { full_name: string } | null };
type AuditLog = { id: string; action: string; entity_type: string; created_at: string; profiles: { full_name: string } | null };

const actionLabels: Record<string, string> = {
  update_ministry_members: "Acesso ou função alterados",
  archive_student: "Adolescente arquivado",
  insert_students: "Adolescente cadastrado",
  update_students: "Cadastro de adolescente atualizado",
  update_attendance: "Presença corrigida",
  insert_event_headcounts: "Contagem de evento registrada",
  update_event_headcounts: "Contagem de evento atualizada",
};

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireAuth();
  if (actor.role !== "admin") redirect("/dashboard");

  const filters = await searchParams;
  const search = filters.search?.trim().toLocaleLowerCase("pt-BR") ?? "";
  const role = ["student", "leader", "admin"].includes(filters.role ?? "") ? filters.role : "all";
  const access = ["active", "inactive"].includes(filters.access ?? "") ? filters.access : "all";
  const supabase = await createClient();

  const [membersResult, auditResult] = await Promise.all([
    supabase.from("ministry_members").select("id,profile_id,role,is_active,profiles(full_name)").eq("ministry_id", actor.ministryId).order("created_at"),
    supabase.from("audit_logs").select("id,action,entity_type,created_at,profiles!audit_logs_actor_id_fkey(full_name)").eq("ministry_id", actor.ministryId).order("created_at", { ascending: false }).limit(20),
  ]);

  const members = (membersResult.data ?? []) as unknown as Member[];
  const auditLogs = (auditResult.data ?? []) as unknown as AuditLog[];
  const filteredMembers = members.filter((member) => {
    const matchesSearch = !search || member.profiles?.full_name.toLocaleLowerCase("pt-BR").includes(search) || member.profile_id.includes(search);
    const matchesRole = role === "all" || member.role === role;
    const matchesAccess = access === "all" || member.is_active === (access === "active");
    return matchesSearch && matchesRole && matchesAccess;
  });
  const activeAdmins = members.filter((member) => member.role === "admin" && member.is_active).length;

  return (
    <>
      <PageHeading eyebrow="Administração" title="Usuários e acessos" description="Controle funções e acessos do ministério com proteção e rastreabilidade." />
      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo dos acessos">
        <article className="card p-4"><p className="text-sm text-[#647268]">Usuários vinculados</p><p className="mt-1 text-2xl font-black">{members.length}</p></article>
        <article className="card p-4"><p className="text-sm text-[#647268]">Acessos ativos</p><p className="mt-1 text-2xl font-black">{members.filter((member) => member.is_active).length}</p></article>
        <article className="card p-4"><p className="text-sm text-[#647268]">Administradores ativos</p><p className="mt-1 text-2xl font-black">{activeAdmins}</p></article>
      </section>
      <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">A plataforma preserva históricos: desative acessos em vez de excluir usuários. O último administrador ativo é protegido. Novas contas devem ser provisionadas pelo fluxo seguro do Supabase; nenhuma chave privilegiada é enviada ao navegador.</p>

      <section aria-labelledby="access-title">
        <div className="mb-4"><h2 id="access-title" className="text-xl font-black">Controle de acesso</h2><p className="mt-1 text-sm text-[#647268]">As alterações são registradas automaticamente.</p></div>
        <form method="get" className="card mb-4 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div><label className="label" htmlFor="search">Buscar usuário</label><input className="input" id="search" name="search" defaultValue={filters.search} placeholder="Nome ou identificador" /></div>
          <div><label className="label" htmlFor="role">Função</label><select className="input" id="role" name="role" defaultValue={role}><option value="all">Todas</option><option value="student">Adolescente</option><option value="leader">Líder</option><option value="admin">Administrador</option></select></div>
          <div><label className="label" htmlFor="access">Acesso</label><select className="input" id="access" name="access" defaultValue={access}><option value="all">Todos</option><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
          <button className="button-primary" type="submit">Filtrar</button>
        </form>
        {membersResult.error ? <p role="alert" className="card p-5 text-red-700">Não foi possível carregar os usuários.</p> : filteredMembers.length === 0 ? <p className="card p-7 text-center text-[#647268]">Nenhum usuário corresponde aos filtros.</p> : (
          <div className="grid gap-3">{filteredMembers.map((member) => <MembershipForm key={member.id} id={member.id} name={member.profiles?.full_name ?? "Usuário sem nome"} profileId={member.profile_id} role={member.role} isActive={member.is_active} isCurrentUser={member.profile_id === actor.userId} />)}</div>
        )}
      </section>

      <section className="mt-10" aria-labelledby="audit-title">
        <div className="mb-4"><h2 id="audit-title" className="text-xl font-black">Atividade administrativa recente</h2><p className="mt-1 text-sm text-[#647268]">Últimas 20 alterações registradas no ministério.</p></div>
        {auditResult.error ? <p role="alert" className="card p-5 text-red-700">Não foi possível carregar a auditoria.</p> : auditLogs.length === 0 ? <p className="card p-7 text-center text-[#647268]">Ainda não existem alterações administrativas registradas.</p> : (
          <ol className="card divide-y divide-[#dfe6df]">{auditLogs.map((log) => <li className="flex flex-wrap justify-between gap-2 p-4" key={log.id}><div><p className="font-semibold">{actionLabels[log.action] ?? log.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-[#647268]">Por {log.profiles?.full_name ?? "processo do sistema"} · {log.entity_type}</p></div><time className="text-sm text-[#647268]" dateTime={log.created_at}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(log.created_at))}</time></li>)}</ol>
        )}
      </section>
    </>
  );
}
