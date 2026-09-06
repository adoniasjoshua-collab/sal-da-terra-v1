import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { calculateAttendanceMetrics, type AttendanceStatus } from "@/services/attendance";
import { getRadarStatus } from "@/services/pastoral-radar";

type Student = { id: string; full_name: string; preferred_name: string | null; status: string; is_active: boolean };
type Event = { id: string; event_date: string; title: string };
type Attendance = { student_id: string; event_id: string; attendance_status: AttendanceStatus };
export default async function DashboardPage() {
  const actor = await requireStaff(); const supabase = await createClient();
  const [{ data: studentData }, { data: eventData }] = await Promise.all([
    supabase.from("students").select("id,full_name,preferred_name,status,is_active").eq("ministry_id", actor.ministryId).neq("status", "archived"),
    supabase.from("events").select("id,event_date,title").eq("ministry_id", actor.ministryId).eq("type", "EBD").eq("status", "completed").order("event_date", { ascending: false }),
  ]);
  const students = (studentData ?? []) as Student[]; const events = (eventData ?? []) as Event[];
  const { data: attendanceData } = events.length ? await supabase.from("attendance").select("student_id,event_id,attendance_status").in("event_id", events.map((event) => event.id)) : { data: [] };
  const attendance = (attendanceData ?? []) as Attendance[]; const eventDates = new Map(events.map((event) => [event.id, event.event_date]));
  const enriched = students.map((student) => { const metrics = calculateAttendanceMetrics(attendance.filter((row) => row.student_id === student.id).map((row) => ({ eventDate: eventDates.get(row.event_id)!, status: row.attendance_status }))); return { ...student, metrics, radar: getRadarStatus(metrics.consecutiveAbsences, student.is_active) }; });
  const last = events[0]; const lastRows = last ? attendance.filter((row) => row.event_id === last.id) : [];
  const count = (status: AttendanceStatus) => lastRows.filter((row) => row.attendance_status === status).length;
  const cards = [
    ["Adolescentes", students.length], ["Ativos", students.filter((s) => s.status === "active").length], ["Visitantes", students.filter((s) => s.status === "visitor").length],
    ["Em atenção", enriched.filter((s) => s.radar === "attention").length], ["Acompanhamento", enriched.filter((s) => s.radar === "follow_up").length], ["Prioridade", enriched.filter((s) => s.radar === "priority").length],
    ["Frequência média", `${students.length ? Math.round(enriched.reduce((sum, s) => sum + s.metrics.presenceRate, 0) / students.length) : 0}%`], ["Presentes — última EBD", count("present")], ["Ausentes — última EBD", count("absent")],
  ];
  const attention = enriched.filter((s) => ["attention","follow_up","priority"].includes(s.radar)).sort((a,b) => b.metrics.consecutiveAbsences - a.metrics.consecutiveAbsences);
  const monthly = [...attendance.reduce((map,row)=>{const month=eventDates.get(row.event_id)?.slice(0,7);if(!month)return map;const item=map.get(month)??{total:0,present:0};item.total++;if(row.attendance_status==="present")item.present++;map.set(month,item);return map;},new Map<string,{total:number;present:number}>())].sort(([a],[b])=>a.localeCompare(b)).slice(-6);
  return <><PageHeading eyebrow="Painel do líder" title="Visão do ministério" description="Indicadores observáveis para organizar participação e acompanhamento." action={<Link href="/eventos/novo" className="button-primary">Nova EBD</Link>}/><p className="mb-6 rounded-xl border border-[#d7e6dc] bg-[#edf7f1] p-4 text-sm text-[#365747]">Indicadores servem para apoiar o cuidado pastoral e não representam uma avaliação da fé ou espiritualidade do adolescente.</p><section aria-label="Indicadores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value]) => <article className="card p-5" key={String(label)}><p className="text-sm font-semibold text-[#647268]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>)}</section><div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><section className="card p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Precisam de atenção</h2><Link href="/adolescentes?filtro=attention" className="text-sm font-bold text-[#176b49]">Ver todos</Link></div>{attention.length === 0 ? <p className="py-8 text-center text-[#647268]">Nenhum alerta de ausência consecutiva.</p> : <div className="divide-y divide-[#e7ece8]">{attention.slice(0,6).map((student) => <article className="flex flex-wrap items-center justify-between gap-3 py-4" key={student.id}><div><Link className="font-bold hover:text-[#176b49]" href={`/adolescentes/${student.id}`}>{student.preferred_name || student.full_name}</Link><p className="mt-1 text-sm text-[#647268]">{student.metrics.consecutiveAbsences} ausências consecutivas · Última presença: {formatDate(student.metrics.lastPresence)}</p></div><StatusBadge status={student.radar}/></article>)}</div>}</section><section className="card p-5 sm:p-6"><p className="text-sm font-semibold text-[#647268]">Última EBD</p><h2 className="mt-1 text-xl font-black">{last ? formatDate(last.event_date) : "Sem registro"}</h2><dl className="mt-5 grid grid-cols-2 gap-3">{[["Presentes",count("present")],["Ausentes",count("absent")],["Justificados",count("justified")],["Visitantes",count("visitor")]].map(([label,value]) => <div className="rounded-xl bg-[#f5f7f3] p-3" key={String(label)}><dt className="text-xs text-[#647268]">{label}</dt><dd className="mt-1 text-xl font-black">{value}</dd></div>)}</dl></section></div><section className="card mt-6 p-5 sm:p-6"><h2 className="text-xl font-black">Evolução mensal da EBD</h2>{monthly.length===0?<p className="mt-4 text-sm text-[#647268]">Dados mensais ainda indisponíveis.</p>:<div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">{monthly.map(([month,value])=>{const rate=Math.round(value.present/value.total*100);return <div key={month}><div className="flex h-28 items-end rounded-lg bg-[#edf1ed] p-1"><div className="w-full rounded-md bg-[#55a478]" style={{height:`${Math.max(rate,4)}%`}} aria-label={`${rate}% de presença`}/></div><p className="mt-2 text-center text-xs font-bold">{month.split("-").reverse().join("/")}</p><p className="text-center text-xs text-[#647268]">{rate}%</p></div>})}</div>}</section></>;
}
