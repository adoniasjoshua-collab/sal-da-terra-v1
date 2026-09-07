export const ADOLESCENT_MIN_AGE = 12;
export const ADOLESCENT_MAX_AGE = 17;
export const BIRTHDAY_LOOKAHEAD_DAYS = 30;

export type StudentLifecycleStatus = "outside_range" | "adolescent" | "transitioning" | "transition_due";

type BirthDateParts = { year: number; month: number; day: number };
type BirthdayStudent = { id: string; full_name: string; preferred_name: string | null; birth_date: string };

function parts(value: string): BirthDateParts {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

function utcDate(value: string): Date {
  const date = parts(value);
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

function anniversary(year: number, birthDate: string): Date {
  const birth = parts(birthDate);
  const lastDay = new Date(Date.UTC(year, birth.month, 0)).getUTCDate();
  return new Date(Date.UTC(year, birth.month - 1, Math.min(birth.day, lastDay)));
}

export function ageOnDate(birthDate: string, referenceDate: string): number {
  const birth = parts(birthDate);
  const reference = parts(referenceDate);
  const birthdayPassed = reference.month > birth.month || (reference.month === birth.month && reference.day >= birth.day);
  return reference.year - birth.year - (birthdayPassed ? 0 : 1);
}

export function getStudentLifecycle(birthDate: string, referenceDate: string): StudentLifecycleStatus {
  const age = ageOnDate(birthDate, referenceDate);
  if (age < ADOLESCENT_MIN_AGE) return "outside_range";
  if (age < ADOLESCENT_MAX_AGE) return "adolescent";
  if (age === ADOLESCENT_MAX_AGE) return "transitioning";
  return "transition_due";
}

export function nextBirthday(birthDate: string, referenceDate: string) {
  const today = utcDate(referenceDate);
  const currentYear = parts(referenceDate).year;
  let date = anniversary(currentYear, birthDate);
  if (date.getTime() < today.getTime()) date = anniversary(currentYear + 1, birthDate);
  const daysUntil = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  return { date: date.toISOString().slice(0, 10), daysUntil, ageTurning: ageOnDate(birthDate, date.toISOString().slice(0, 10)) };
}

export function buildBirthdayOverview<T extends BirthdayStudent>(students: T[], referenceDate: string) {
  const reference = parts(referenceDate);
  const today = utcDate(referenceDate);
  const decorated = students.map((student) => {
    const thisYearDate = anniversary(reference.year, student.birth_date);
    const thisYearValue = thisYearDate.toISOString().slice(0, 10);
    return {
      ...student,
      birthday: nextBirthday(student.birth_date, referenceDate),
      birthdayThisYear: {
        date: thisYearValue,
        daysUntil: Math.round((thisYearDate.getTime() - today.getTime()) / 86_400_000),
        ageTurning: ageOnDate(student.birth_date, thisYearValue),
      },
    };
  });
  const thisMonth = decorated
    .filter((student) => parts(student.birth_date).month === reference.month)
    .map((student) => ({ ...student, birthday: student.birthdayThisYear }))
    .sort((a, b) => parts(a.birth_date).day - parts(b.birth_date).day || a.full_name.localeCompare(b.full_name, "pt-BR"));
  const upcoming = decorated
    .filter((student) => parts(student.birth_date).month !== reference.month && student.birthday.daysUntil <= BIRTHDAY_LOOKAHEAD_DAYS)
    .sort((a, b) => a.birthday.daysUntil - b.birthday.daysUntil || a.full_name.localeCompare(b.full_name, "pt-BR"));
  return { thisMonth, upcoming };
}
