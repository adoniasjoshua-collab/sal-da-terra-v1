import { PageHeading } from "@/components/page-heading";
import { QuickEventForm } from "@/features/events/quick-event-form";
import { requireStaff } from "@/lib/auth";

export default async function RegisterCompletedEventPage() {
  await requireStaff();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return (
    <>
      <PageHeading eyebrow="Registro rápido" title="Registrar evento realizado" description="Informe o evento e a quantidade de participantes em uma única etapa." />
      <QuickEventForm today={today} />
    </>
  );
}
