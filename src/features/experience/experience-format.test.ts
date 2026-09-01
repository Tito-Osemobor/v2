import { describe, expect, it } from "vitest";
import {
  formatCompanyRange,
  formatExperienceDate,
  formatPositionRange,
  isCurrentExperience,
} from "./experience-format";

describe("experience date formatting", () => {
  it("formats machine dates and the present sentinel", () => {
    expect(formatExperienceDate("2026-08")).toBe("Aug 2026");
    expect(formatExperienceDate("present")).toBe("Present");
  });

  it("formats position and company ranges", () => {
    const positions = [
      { id: "new", role: "Senior", start: "2025-01", end: "present" },
      { id: "old", role: "Engineer", start: "2023-02", end: "2024-12" },
    ] as const;
    expect(formatPositionRange(positions[1])).toBe("Feb 2023 — Dec 2024");
    expect(formatCompanyRange([...positions])).toBe("Feb 2023 — Present");
  });

  it("derives current status from the newest position", () => {
    expect(
      isCurrentExperience([
        { id: "current", role: "Engineer", start: "2026-01", end: "present" },
      ]),
    ).toBe(true);
    expect(
      isCurrentExperience([
        { id: "past", role: "Engineer", start: "2025-01", end: "2025-12" },
      ]),
    ).toBe(false);
    expect(isCurrentExperience([])).toBe(false);
  });
});
