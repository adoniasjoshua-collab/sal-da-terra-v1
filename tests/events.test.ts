import { describe, expect, it } from "vitest";
import { defaultAttendanceMode, EVENT_TYPE_LABELS, isAttendanceStatusAllowed } from "../src/services/events";

describe("event configuration", () => {
  it("uses privacy-aware defaults for each event type", () => {
    expect(defaultAttendanceMode("EBD")).toBe("full_roster");
    expect(defaultAttendanceMode("worship")).toBe("headcount_only");
    expect(defaultAttendanceMode("evangelism")).toBe("headcount_only");
    expect(defaultAttendanceMode("volunteer_action")).toBe("participation_only");
    expect(defaultAttendanceMode("retreat")).toBe("full_roster");
  });

  it("provides clear labels for the expanded event taxonomy", () => {
    expect(EVENT_TYPE_LABELS.evangelism).toBe("Evangelismo");
    expect(EVENT_TYPE_LABELS.retreat).toBe("Retiro ou acampamento");
  });

  it("enforces outcomes that match each participation mode", () => {
    expect(isAttendanceStatusAllowed("full_roster", "absent")).toBe(true);
    expect(isAttendanceStatusAllowed("full_roster", "not_participated")).toBe(false);
    expect(isAttendanceStatusAllowed("participation_only", "present")).toBe(true);
    expect(isAttendanceStatusAllowed("participation_only", "not_participated")).toBe(true);
    expect(isAttendanceStatusAllowed("participation_only", "absent")).toBe(false);
    expect(isAttendanceStatusAllowed("participation_only", "justified")).toBe(false);
    expect(isAttendanceStatusAllowed("headcount_only", "present")).toBe(false);
    expect(isAttendanceStatusAllowed("headcount_only", "not_participated")).toBe(false);
  });
});
