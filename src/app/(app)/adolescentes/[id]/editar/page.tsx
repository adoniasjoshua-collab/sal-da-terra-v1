import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { StudentForm } from "@/features/students/student-form";
import { StudentLifecycleForm } from "@/features/students/student-lifecycle-form";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function EditStudentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  const actor = await requireStaff();
  const { id } = await params;
  const { salvo } = await searchParams;
  const supabase = await createClient();
  const { data: student, error } = await supabase.from("students").select("*")
    .eq("id", id).eq("ministry_id", actor.ministryId).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o cadastro para edição.");
  if (!student) notFound();

  return <>
    <PageHeading eyebrow="Adolescentes" title="Editar cadastro e status" description={student.full_name}
      action={<Link className="button-secondary" href={`/adolescentes/${id}`}>Voltar ao perfil</Link>} />
    {salvo === "1" && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">Cadastro e status atualizados.</p>}
    <StudentForm key={student.updated_at} student={student} />
    <StudentLifecycleForm id={id} archived={student.status === "archived"} />
  </>;
}
