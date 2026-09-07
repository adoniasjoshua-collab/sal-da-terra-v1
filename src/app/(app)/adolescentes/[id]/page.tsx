import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { FollowupForm } from "@/features/followups/followup-form";
import { StudentForm } from "@/features/students/student-form";
import { StudentLifecycleForm } from "@/features/students/student-lifecycle-form";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { calculateAttendanceMetrics, type AttendanceStatus } from "@/services/attendance";
import { EVENT_TYPE_LABELS, type EventType } from "@/services/events";
import { getRadarStatus } from "@/services/pastoral-radar";
import { ageOnDate, getStudentLifecycle } from "@/services/student-lifecycle";

type Props = { params: Promise<{ id: string }> };

export default async function StudentProfilePage({ params }: Props) {
  const actor = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .eq("ministry_id", actor.ministryId)
    .single();

  if (!student) notFound();

  const [{ data: events }, { data: followups }] = await Promise.all([
    supabase
      .from("events")
      .select("id,event_date,title,type")
      .eq("ministry_id", actor.ministryId)
      .eq("status", "completed")
      .order("event_date", { ascending: false }),
    supabase
      .from("pastoral_followups")
      .select("id,followup_type,occurred_at,summary,next_action,next_action_date,status,is_sensitive")
      .eq("student_id", id)
      .order("occurred_at", { ascending: false }),
  ]);

  const { data: attendance } = events?.length
    ? await supabase
        .from("attendance")
        .select("event_id,attendance_status")
        .eq("student_id", id)
        .in("event_id", events.map((event) => event.id))
    : { data: [] };

  const eventMap = new Map((events ?? []).map((event) => [event.id, event]));
  const records = (attendance ?? [])
    .filter((item) => eventMap.get(item.event_id)?.type === "EBD")
    .map((item) => ({
      eventDate: eventMap.get(item.event_id)!.event_date,
      status: item.attendance_status as AttendanceStatus,
    }));
  const metrics = calculateAttendanceMetrics(records);
  const radar = getRadarStatus(metrics.consecutiveAbsences, student.is_active);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const lifecycle = getStudentLifecycle(student.birth_date, today);
  const history = (attendance ?? [])
    .map((row) => ({ ...row, event: eventMap.get(row.event_id) }))
    .sort((a, b) => b.event!.event_date.localeCompare(a.event!.event_date));
  const ebdHistory = history.filter((row) => row.event?.type === "EBD");
  const participationTimeline = history.filter((row) =>
    row.event?.type !== "EBD" && ["present", "visitor"].includes(row.attendance_status),
  );

  const metricCards = [
    ["Frequência", `${metrics.presenceRate}%`],
    ["Presenças", metrics.present],
    ["Ausências", metrics.absent],
    ["Justificadas", metrics.justified],
    ["Ausências seguidas", metrics.consecutiveAbsences],
    ["Sequência presente", metrics.currentPresenceStreak],
    ["Maior sequência", metrics.longestPresenceStreak],
    ["Última presença", formatDate(metrics.lastPresence)],
  ];

  return (
    <>
      <PageHeading
        eyebrow="Perfil 360°"
        title={student.preferred_name || student.full_name}
        description={`${ageOnDate(student.birth_date, today)} anos · Desde ${formatDate(student.joined_at)}`}
        action={<StatusBadge status={radar} />}
      />
      <p className="mb-6 rounded-xl bg-[#edf7f1] p-4 text-sm text-[#365747]">
        Este radar apoia o cuidado pastoral com base em participação observável; não avalia fé ou espiritualidade.
      </p>
      {lifecycle === "transitioning" && <p className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><strong>Em transição para jovens:</strong> este adolescente está no último ano da faixa de 12 a 17 anos. Organize o diálogo e o acolhimento no próximo grupo, sem alterar o cadastro automaticamente.</p>}
      {lifecycle === "transition_due" && <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Transição pendente:</strong> a pessoa já completou 18 anos. Revise o vínculo com a liderança antes de arquivar, preservando todo o histórico.</p>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(([label, value]) => (
          <article className="card p-4" key={String(label)}>
            <p className="text-xs text-[#647268]">{label}</p>
            <p className="mt-1 text-xl font-black">{value}</p>
          </article>
        ))}
      </section>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-black">Dados autorizados</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-[#647268]">Nome completo</dt><dd className="font-semibold">{student.full_name}</dd></div>
            <div><dt className="text-[#647268]">Responsável</dt><dd className="font-semibold">{student.guardian_name} · {student.guardian_relationship}</dd></div>
            <div><dt className="text-[#647268]">Telefone do responsável</dt><dd className="font-semibold">{student.guardian_phone}</dd></div>
            <div><dt className="text-[#647268]">Status cadastral</dt><dd className="font-semibold capitalize">{student.status}</dd></div>
          </dl>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-black">Últimos domingos</h2>
          {ebdHistory.length === 0 ? (
            <p className="mt-4 text-sm text-[#647268]">Nenhuma chamada registrada.</p>
          ) : (
            <div className="mt-3 divide-y divide-[#e7ece8]">
              {ebdHistory.slice(0, 8).map((row) => (
                <div className="flex justify-between py-3 text-sm" key={row.event_id}>
                  <span>{formatDate(row.event?.event_date)}</span>
                  <span className="font-bold capitalize">
                    {({ present: "Presente", absent: "Ausente", justified: "Justificada", visitor: "Visitante" } as Record<string, string>)[row.attendance_status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card mt-7 p-5 sm:p-6">
        <h2 className="text-xl font-black">Timeline de participação</h2>
        <p className="mt-1 text-sm text-[#647268]">Cultos, missão, serviço e convivência registrados pela liderança.</p>
        {participationTimeline.length === 0 ? (
          <p className="mt-5 text-sm text-[#647268]">Nenhuma participação adicional registrada.</p>
        ) : (
          <div className="mt-4 divide-y divide-[#e7ece8]">
            {participationTimeline.map((row) => (
              <article className="flex flex-wrap items-center justify-between gap-3 py-4" key={row.event_id}>
                <div>
                  <p className="font-bold">{row.event?.title}</p>
                  <p className="mt-1 text-sm text-[#647268]">{EVENT_TYPE_LABELS[row.event?.type as EventType]}</p>
                </div>
                <time className="text-sm font-semibold">{formatDate(row.event?.event_date)}</time>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card mt-7 p-5 sm:p-6">
        <h2 className="text-xl font-black">Acompanhamentos pastorais</h2>
        <div className="mt-5"><FollowupForm studentId={id} /></div>
        {followups?.length ? (
          <div className="mt-7 divide-y divide-[#e7ece8]">
            {followups.map((item) => (
              <article className="py-4" key={item.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-bold capitalize">{item.followup_type.replaceAll("_", " ")}</p>
                  <time className="text-sm text-[#647268]">{formatDate(item.occurred_at)}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{item.summary}</p>
                {item.next_action && (
                  <p className="mt-2 text-sm text-[#647268]">
                    Próxima ação: {item.next_action} {item.next_action_date && `· ${formatDate(item.next_action_date)}`}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-[#647268]">Nenhum acompanhamento registrado.</p>
        )}
      </section>

      <section className="mt-7">
        <h2 className="mb-4 text-xl font-black">Editar cadastro</h2>
        {student.status !== "archived" && <StudentForm student={student} />}
        <StudentLifecycleForm id={id} archived={student.status === "archived"} />
      </section>

      <section className="card mt-7 border-dashed p-6">
        <p className="text-sm font-bold text-[#176b49]">Minha Jornada · futuro</p>
        <p className="mt-1 text-sm text-[#647268]">
          Trilhas, aulas, quizzes, missões e certificados serão adicionados em uma próxima fase.
        </p>
      </section>
    </>
  );
}
