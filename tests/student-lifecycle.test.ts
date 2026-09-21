import { describe, expect, it } from "vitest";
import { ageOnDate, buildBirthdayOverview, getStudentLifecycle, nextBirthday } from "../src/services/student-lifecycle";

describe("student lifecycle", () => {
  it("calculates age around the birthday", () => {
    expect(ageOnDate("2009-09-08", "2026-09-07")).toBe(16);
    expect(ageOnDate("2009-09-08", "2026-09-08")).toBe(17);
  });

  it.each([
    ["2016-09-21", "outside_range"], // 10
    ["2015-09-21", "adolescent"], // 11, inclusive minimum
    ["2012-09-21", "adolescent"], // 14
    ["2011-09-21", "transitioning"], // 15, still an adolescent
    ["2010-09-21", "transition_due"], // 16
    ["2008-09-21", "transition_due"], // older records remain reviewable
  ])("classifies birth date %s as %s", (birthDate, expected) => {
    expect(getStudentLifecycle(birthDate, "2026-09-21")).toBe(expected);
  });

  it("changes classification on the exact 11th, 15th and 16th birthdays", () => {
    for (const [birthDate, before, onBirthday] of [
      ["2015-09-22", "outside_range", "adolescent"],
      ["2011-09-22", "adolescent", "transitioning"],
      ["2010-09-22", "transitioning", "transition_due"],
    ]) {
      expect(getStudentLifecycle(birthDate, "2026-09-21")).toBe(before);
      expect(getStudentLifecycle(birthDate, "2026-09-22")).toBe(onBirthday);
    }
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
