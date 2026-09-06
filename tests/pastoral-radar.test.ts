import { describe, expect, it } from "vitest";
import { getRadarStatus } from "../src/services/pastoral-radar";

describe("pastoral radar", () => {
  it.each([[0, "active"], [1, "active"], [2, "attention"], [3, "follow_up"], [4, "priority"], [8, "priority"]] as const)("maps %i absences to %s", (absences, expected) => {
    expect(getRadarStatus(absences)).toBe(expected);
  });
  it("keeps inactive membership explicit", () => expect(getRadarStatus(0, false)).toBe("inactive"));
});
