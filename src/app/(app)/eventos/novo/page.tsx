import { PageHeading } from "@/components/page-heading";
import { EventForm } from "@/features/events/event-form";
import { requireStaff } from "@/lib/auth";
export default async function NewEventPage(){await requireStaff();return <><PageHeading eyebrow="Eventos" title="Nova EBD" description="Depois de criar, marque a turma inteira na chamada mobile."/><EventForm/></>}
