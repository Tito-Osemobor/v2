import fs from "node:fs";
import path from "node:path";
import type {
  CompanyExperience,
  SiteContent,
  YearMonth,
} from "@/content/types";

export type ContentIssue = {
  code: "duplicate" | "invalid" | "missing-file" | "too-many" | "todo";
  path: string;
  message: string;
};

const hasTodo = (value: unknown): boolean => {
  if (typeof value === "string") return value.toUpperCase().includes("TODO");
  if (Array.isArray(value)) return value.some(hasTodo);
  if (value && typeof value === "object") {
    return Object.values(value).some(hasTodo);
  }
  return false;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const isHexColor = (value: string): boolean => /^#[0-9a-f]{6}$/i.test(value);

export const isGitHubRepository = (value: string): boolean =>
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);

export const isYearMonth = (value: string): value is YearMonth => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
};

const findDuplicates = (values: string[]): string[] =>
  values.filter((value, index) => values.indexOf(value) !== index);

const dateValue = (value: YearMonth | "present"): number =>
  value === "present"
    ? Number.POSITIVE_INFINITY
    : Number(value.replace("-", ""));

function validateExperience(
  experience: CompanyExperience,
  index: number,
  publicDirectory: string,
): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const issuePath = `experience.${index}`;

  if (experience.positions.length === 0) {
    return [
      {
        code: "invalid",
        path: `${issuePath}.positions`,
        message: "A company must contain at least one position.",
      },
    ];
  }

  for (const duplicate of new Set(
    findDuplicates(experience.positions.map((position) => position.id)),
  )) {
    issues.push({
      code: "duplicate",
      path: `${issuePath}.positions`,
      message: `Duplicate position id: ${duplicate}`,
    });
  }

  experience.positions.forEach((position, positionIndex) => {
    const positionPath = `${issuePath}.positions.${positionIndex}`;
    if (!isYearMonth(position.start)) {
      issues.push({
        code: "invalid",
        path: `${positionPath}.start`,
        message: "Position start must use YYYY-MM.",
      });
    }
    if (position.end !== "present" && !isYearMonth(position.end)) {
      issues.push({
        code: "invalid",
        path: `${positionPath}.end`,
        message: 'Position end must use YYYY-MM or "present".',
      });
    }
    if (position.end === "present" && positionIndex !== 0) {
      issues.push({
        code: "invalid",
        path: `${positionPath}.end`,
        message: 'Only the newest position may use "present".',
      });
    }
    if (
      isYearMonth(position.start) &&
      (position.end === "present" || isYearMonth(position.end)) &&
      dateValue(position.start) > dateValue(position.end)
    ) {
      issues.push({
        code: "invalid",
        path: positionPath,
        message: "Position start cannot be after its end.",
      });
    }
    const prior = experience.positions[positionIndex - 1];
    if (prior && dateValue(prior.start) < dateValue(position.start)) {
      issues.push({
        code: "invalid",
        path: `${issuePath}.positions`,
        message: "Positions must be ordered newest first.",
      });
    }
  });

  if (experience.url && !isHttpUrl(experience.url)) {
    issues.push({
      code: "invalid",
      path: `${issuePath}.url`,
      message: "Company URL must use HTTP or HTTPS.",
    });
  }
  if (experience.accent && !isHexColor(experience.accent)) {
    issues.push({
      code: "invalid",
      path: `${issuePath}.accent`,
      message: "Company accent must be a six-digit hex color.",
    });
  }
  if (experience.logo) {
    const logoPath = path.join(
      publicDirectory,
      experience.logo.replace(/^\//, ""),
    );
    if (!fs.existsSync(logoPath)) {
      issues.push({
        code: "missing-file",
        path: `${issuePath}.logo`,
        message: `Missing company logo: ${experience.logo}`,
      });
    }
  }
  return issues;
}

export function validateSiteContent(
  content: SiteContent,
  options: { publicDirectory: string },
): ContentIssue[] {
  const issues: ContentIssue[] = [];

  for (const duplicate of new Set(
    findDuplicates(content.experience.map((experience) => experience.id)),
  )) {
    issues.push({
      code: "duplicate",
      path: "experience",
      message: `Duplicate company id: ${duplicate}`,
    });
  }
  content.experience.forEach((experience, index) => {
    issues.push(
      ...validateExperience(experience, index, options.publicDirectory),
    );
  });

  for (const duplicate of new Set(
    findDuplicates(content.projects.map((project) => project.slug)),
  )) {
    issues.push({
      code: "duplicate",
      path: "projects",
      message: `Duplicate project slug: ${duplicate}`,
    });
  }

  content.projects.forEach((project, index) => {
    const issuePath = `projects.${index}`;
    if (!isHttpUrl(project.primaryUrl)) {
      issues.push({
        code: "invalid",
        path: `${issuePath}.primaryUrl`,
        message: "Project URL must use HTTP or HTTPS.",
      });
    }
    if (project.githubRepo && !isGitHubRepository(project.githubRepo)) {
      issues.push({
        code: "invalid",
        path: `${issuePath}.githubRepo`,
        message: "GitHub repository must use owner/repository format.",
      });
    }
    if (project.technologies.length > 3) {
      issues.push({
        code: "too-many",
        path: `${issuePath}.technologies`,
        message: "Project rows support at most three technologies.",
      });
    }
    if (
      project.imageFocalPoint &&
      (project.imageFocalPoint.x < 0 ||
        project.imageFocalPoint.x > 100 ||
        project.imageFocalPoint.y < 0 ||
        project.imageFocalPoint.y > 100)
    ) {
      issues.push({
        code: "invalid",
        path: `${issuePath}.imageFocalPoint`,
        message: "Image focal-point coordinates must be between 0 and 100.",
      });
    }

    const absoluteImagePath = path.join(
      options.publicDirectory,
      project.image.replace(/^\//, ""),
    );
    if (!fs.existsSync(absoluteImagePath)) {
      issues.push({
        code: "missing-file",
        path: `${issuePath}.image`,
        message: `Missing public image: ${project.image}`,
      });
    }
  });

  if (content.identity.avatar) {
    const avatarPath = path.join(
      options.publicDirectory,
      content.identity.avatar.replace(/^\//, ""),
    );
    if (!fs.existsSync(avatarPath)) {
      issues.push({
        code: "missing-file",
        path: "identity.avatar",
        message: `Missing portrait: ${content.identity.avatar}`,
      });
    }
  }

  content.socials.forEach((social, index) => {
    if (!isHttpUrl(social.url)) {
      issues.push({
        code: "invalid",
        path: `socials.${index}.url`,
        message: "Social URL must use HTTP or HTTPS.",
      });
    }
  });

  if (!content.seo.title.trim()) {
    issues.push({
      code: "invalid",
      path: "seo.title",
      message: "SEO title is required.",
    });
  }
  if (
    !isHttpUrl(content.seo.canonicalUrl) ||
    !content.seo.canonicalUrl.startsWith("https://")
  ) {
    issues.push({
      code: "invalid",
      path: "seo.canonicalUrl",
      message: "Canonical URL must use HTTPS.",
    });
  }
  if (!content.seo.socialImage.path.startsWith("/")) {
    issues.push({
      code: "invalid",
      path: "seo.socialImage.path",
      message: "Social image path must be root-relative.",
    });
  }
  if (!content.seo.socialImage.alt.trim()) {
    issues.push({
      code: "invalid",
      path: "seo.socialImage.alt",
      message: "Social image alternative text is required.",
    });
  }
  if (
    content.status === "ready" &&
    (content.seo.description.length < 80 ||
      content.seo.description.length > 160)
  ) {
    issues.push({
      code: "invalid",
      path: "seo.description",
      message: "Ready SEO descriptions must contain 80–160 characters.",
    });
  }
  if (content.status === "ready" && hasTodo(content)) {
    issues.push({
      code: "todo",
      path: "siteContent",
      message: "Ready content cannot contain TODO placeholders.",
    });
  }
  return issues;
}

export const contentHasTodo = hasTodo;
