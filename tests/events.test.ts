import { describe, expect, it } from "vitest";
import { defaultAttendanceMode, EVENT_TYPE_LABELS } from "../src/services/events";

describe("event configuration", () => {
  it("uses a full roster only for EBD by default", () => {
    expect(defaultAttendanceMode("EBD")).toBe("full_roster");
    expect(defaultAttendanceMode("worship")).toBe("participation_only");
    expect(defaultAttendanceMode("volunteer_action")).toBe("participation_only");
  });

  it("provides clear labels for the expanded event taxonomy", () => {
    expect(EVENT_TYPE_LABELS.evangelism).toBe("Evangelismo");
    expect(EVENT_TYPE_LABELS.retreat).toBe("Retiro ou acampamento");
  });
});
