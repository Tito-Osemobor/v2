import type { ExperiencePosition, YearMonth } from "@/content/types";

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export function formatExperienceDate(value: YearMonth | "present"): string {
  if (value === "present") return "Present";
  const [year, month] = value.split("-").map(Number);
  return monthFormatter.format(new Date(Date.UTC(year ?? 0, (month ?? 1) - 1)));
}

export function formatPositionRange(position: ExperiencePosition): string {
  return `${formatExperienceDate(position.start)} — ${formatExperienceDate(position.end)}`;
}

export function formatCompanyRange(positions: ExperiencePosition[]): string {
  const newest = positions[0];
  const oldest = positions.at(-1);
  if (!newest || !oldest) return "";
  return `${formatExperienceDate(oldest.start)} — ${formatExperienceDate(newest.end)}`;
}

export function isCurrentExperience(positions: ExperiencePosition[]): boolean {
  return positions[0]?.end === "present";
}
