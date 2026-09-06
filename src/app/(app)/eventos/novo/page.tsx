import { PageHeading } from "@/components/page-heading";
import { EventForm } from "@/features/events/event-form";
import { requireStaff } from "@/lib/auth";
export default async function NewEventPage(){await requireStaff();return <><PageHeading eyebrow="Eventos" title="Novo evento" description="Escolha o tipo e como a participação será registrada."/><EventForm/></>}
