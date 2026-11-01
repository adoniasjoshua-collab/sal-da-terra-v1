import { PageHeading } from "@/components/page-heading";
import { EventForm } from "@/features/events/event-form";
import { requireStaff } from "@/lib/auth";
export default async function NewEventPage(){await requireStaff();return <><PageHeading eyebrow="Eventos" title="Novo evento" description="Para a aula da EBD, mantenha o tipo Escola Bíblica Dominical. A data pode ser de um domingo já realizado; depois salve e faça a chamada."/><EventForm/></>}
