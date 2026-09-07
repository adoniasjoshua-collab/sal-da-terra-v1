import { describe, expect, it } from "vitest";
import { ageOnDate, buildBirthdayOverview, getStudentLifecycle, nextBirthday } from "../src/services/student-lifecycle";

describe("student lifecycle", () => {
  it("calculates age around the birthday", () => {
    expect(ageOnDate("2009-09-08", "2026-09-07")).toBe(16);
    expect(ageOnDate("2009-09-08", "2026-09-08")).toBe(17);
  });

  it("marks age 17 as transitioning and age 18 as due", () => {
    expect(getStudentLifecycle("2009-01-10", "2026-09-07")).toBe("transitioning");
    expect(getStudentLifecycle("2008-01-10", "2026-09-07")).toBe("transition_due");
  });

  it("finds birthdays across the year boundary", () => {
    expect(nextBirthday("2011-01-05", "2026-12-20")).toEqual({ date: "2027-01-05", daysUntil: 16, ageTurning: 16 });
  });

  it("recognizes leap-day birthdays on February 28 in common years", () => {
    expect(nextBirthday("2012-02-29", "2026-02-27").date).toBe("2026-02-28");
  });

  it("separates this month from the next 30 days without duplicates", () => {
    const overview = buildBirthdayOverview([
      { id: "1", full_name: "Ana", preferred_name: null, birth_date: "2011-09-20" },
      { id: "2", full_name: "Bia", preferred_name: null, birth_date: "2011-10-02" },
    ], "2026-09-07");
    expect(overview.thisMonth.map((item) => item.id)).toEqual(["1"]);
    expect(overview.upcoming.map((item) => item.id)).toEqual(["2"]);
  });
});
