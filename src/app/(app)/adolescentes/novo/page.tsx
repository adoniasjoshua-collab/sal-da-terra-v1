import { PageHeading } from "@/components/page-heading";
import { StudentForm } from "@/features/students/student-form";
import { requireStaff } from "@/lib/auth";
export default async function NewStudentPage(){await requireStaff();return <><PageHeading eyebrow="Adolescentes" title="Novo cadastro" description="Colete apenas os dados necessários para cuidado e contato autorizado."/><StudentForm/></>}
