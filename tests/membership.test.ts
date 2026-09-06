import { describe, expect, it } from "vitest";
import { removesActiveAdmin } from "../src/services/membership";

describe("membership administration", () => {
  it("detects deactivation of an active administrator", () => {
    expect(removesActiveAdmin("admin", true, "admin", false)).toBe(true);
  });

  it("detects demotion of an active administrator", () => {
    expect(removesActiveAdmin("admin", true, "leader", true)).toBe(true);
  });

  it("does not block unrelated membership changes", () => {
    expect(removesActiveAdmin("leader", true, "student", true)).toBe(false);
    expect(removesActiveAdmin("admin", true, "admin", true)).toBe(false);
  });
});
