import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";
import type {
  GitHubRepository,
  Project,
  SiteContent,
  YearMonth,
} from "@/content/types";
import {
  contentHasTodo,
  isGitHubRepository,
  isYearMonth,
  validateSiteContent,
} from "./content-validation";

const publicDirectory = path.join(process.cwd(), "public");
const cloneContent = (): SiteContent => structuredClone(siteContent);
const projectFixture: Project = {
  slug: "project-one",
  title: "Project one",
  description: "A test project.",
  image: "/assets/identity/tito-profile.webp",
  technologies: ["TypeScript"],
  primaryUrl: "https://example.com/project-one",
  featured: true,
};

describe("portfolio content", () => {
  it("accepts the checked-in ready content and its local media", () => {
    expect(validateSiteContent(siteContent, { publicDirectory })).toEqual([]);
    expect(siteContent.status).toBe("ready");
    expect(contentHasTodo(siteContent)).toBe(false);
  });

  it("allows the portfolio to publish without projects", () => {
    const content = cloneContent();
    content.projects = [];
    expect(validateSiteContent(content, { publicDirectory })).toEqual([]);
  });

  it("keeps company, position, and project identifiers unique", () => {
    const companyIds = siteContent.experience.map(({ id }) => id);
    const positionIds = siteContent.experience.flatMap(({ positions }) =>
      positions.map(({ id }) => id),
    );
    const projectSlugs = siteContent.projects.map(({ slug }) => slug);
    expect(new Set(companyIds).size).toBe(companyIds.length);
    expect(new Set(positionIds).size).toBe(positionIds.length);
    expect(new Set(projectSlugs).size).toBe(projectSlugs.length);
  });

  it.each([
    ["owner/repository", true],
    ["owner/repository.with-dots", true],
    ["owner", false],
    ["owner/repository/extra", false],
    ["owner with spaces/repo", false],
  ])("validates GitHub repository identifier %s", (value, expected) => {
    expect(isGitHubRepository(value)).toBe(expected);
  });

  it.each([
    ["2026-01", true],
    ["2026-12", true],
    ["2026-00", false],
    ["2026-13", false],
    ["TODO", false],
  ])("validates machine month %s", (value, expected) => {
    expect(isYearMonth(value)).toBe(expected);
  });

  it("reports duplicated identifiers and invalid project constraints", () => {
    const content = cloneContent();
    content.projects = [
      structuredClone(projectFixture),
      { ...structuredClone(projectFixture), slug: "project-two" },
    ];
    const firstProject = content.projects[0];
    const secondProject = content.projects[1];
    if (!firstProject || !secondProject) throw new Error("Fixture incomplete");
    secondProject.slug = firstProject.slug;
    firstProject.technologies = ["one", "two", "three", "four"];
    firstProject.primaryUrl = "javascript:alert(1)";
    firstProject.githubRepo = "not-a-repository" as GitHubRepository;
    firstProject.image = "/placeholders/missing.svg";
    firstProject.imageFocalPoint = { x: -1, y: 101 };

    const issues = validateSiteContent(content, { publicDirectory });
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate", path: "projects" }),
        expect.objectContaining({ code: "too-many" }),
        expect.objectContaining({ path: "projects.0.imageFocalPoint" }),
        expect.objectContaining({ code: "missing-file" }),
      ]),
    );
  });

  it("rejects empty, invalid, reversed, and misordered company journeys", () => {
    const empty = cloneContent();
    const emptyCompany = empty.experience[0];
    if (!emptyCompany) throw new Error("Fixture incomplete");
    emptyCompany.positions = [];
    expect(validateSiteContent(empty, { publicDirectory })).toContainEqual(
      expect.objectContaining({ path: "experience.0.positions" }),
    );

    const invalid = cloneContent();
    const company = invalid.experience[0];
    if (!company) throw new Error("Fixture incomplete");
    company.positions = [
      {
        id: "newest",
        role: "Newest role",
        start: "2027-01",
        end: "2026-01",
      },
      {
        id: "older",
        role: "Older role",
        start: "2028-01",
        end: "present",
      },
    ];
    const paths = validateSiteContent(invalid, { publicDirectory }).map(
      ({ path: issuePath }) => issuePath,
    );
    expect(paths).toContain("experience.0.positions.0");
    expect(paths).toContain("experience.0.positions.1.end");
    expect(paths).toContain("experience.0.positions");
  });

  it("rejects malformed month values despite the compile-time type", () => {
    const content = cloneContent();
    const position = content.experience[0]?.positions[0];
    if (!position) throw new Error("Fixture incomplete");
    position.start = "2026-14" as YearMonth;
    expect(validateSiteContent(content, { publicDirectory })).toContainEqual(
      expect.objectContaining({ path: "experience.0.positions.0.start" }),
    );
  });

  it("rejects missing company logos", () => {
    const content = cloneContent();
    const company = content.experience[0];
    if (!company) throw new Error("Fixture incomplete");
    company.logo = "/missing-company-logo.svg";
    expect(validateSiteContent(content, { publicDirectory })).toContainEqual(
      expect.objectContaining({
        code: "missing-file",
        path: "experience.0.logo",
      }),
    );
  });

  it("rejects malformed company accent colors", () => {
    const content = cloneContent();
    const company = content.experience[0];
    if (!company) throw new Error("Fixture incomplete");
    company.accent = "#blue" as `#${string}`;
    expect(validateSiteContent(content, { publicDirectory })).toContainEqual(
      expect.objectContaining({ path: "experience.0.accent" }),
    );
  });

  it("allows placeholders only in draft", () => {
    const content = cloneContent();
    content.contact.heading = "TODO: Write a heading";
    expect(validateSiteContent(content, { publicDirectory })).toContainEqual(
      expect.objectContaining({ code: "todo", path: "siteContent" }),
    );
    content.status = "draft";
    expect(
      validateSiteContent(content, { publicDirectory }),
    ).not.toContainEqual(expect.objectContaining({ code: "todo" }));
  });

  it("enforces concise ready SEO description boundaries", () => {
    const content = cloneContent();
    content.seo.description = "x".repeat(79);
    expect(validateSiteContent(content, { publicDirectory })).toContainEqual(
      expect.objectContaining({ path: "seo.description" }),
    );
    content.seo.description = "x".repeat(80);
    expect(
      validateSiteContent(content, { publicDirectory }),
    ).not.toContainEqual(expect.objectContaining({ path: "seo.description" }));
    content.seo.description = "x".repeat(160);
    expect(
      validateSiteContent(content, { publicDirectory }),
    ).not.toContainEqual(expect.objectContaining({ path: "seo.description" }));
    content.seo.description = "x".repeat(161);
    expect(validateSiteContent(content, { publicDirectory })).toContainEqual(
      expect.objectContaining({ path: "seo.description" }),
    );
  });

  it("ships the approved search and social-preview copy", () => {
    expect(siteContent.seo).toMatchObject({
      title: "Tito Osemobor",
      description:
        "Tito Osemobor: Software Engineer, view my experience, socials, ways to get in touch and more.",
      socialImage: {
        path: "/social-image",
        alt: "Social preview for Tito Osemobor, a Toronto-based software engineer, featuring the cyan and navy TO monogram.",
      },
    });
  });

  it("requires a title and HTTPS canonical URL", () => {
    const content = cloneContent();
    content.seo.title = "";
    content.seo.canonicalUrl = "http://example.com";
    const paths = validateSiteContent(content, { publicDirectory }).map(
      ({ path: issuePath }) => issuePath,
    );
    expect(paths).toEqual(
      expect.arrayContaining(["seo.title", "seo.canonicalUrl"]),
    );
  });

  it("requires a root-relative social image and meaningful alt text", () => {
    const content = cloneContent();
    content.seo.socialImage.path = "social-image" as `/${string}`;
    content.seo.socialImage.alt = "";
    const paths = validateSiteContent(content, { publicDirectory }).map(
      ({ path: issuePath }) => issuePath,
    );
    expect(paths).toEqual(
      expect.arrayContaining(["seo.socialImage.path", "seo.socialImage.alt"]),
    );
  });
});

describe("checked-in identity and icon assets", () => {
  const readPngSize = (file: string) => {
    const bytes = fs.readFileSync(file);
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  };

  it("keeps the portrait square, WebP, and below 150KB", () => {
    const avatar = path.join(
      publicDirectory,
      "assets/identity/tito-profile.webp",
    );
    const bytes = fs.readFileSync(avatar);
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
    const chunk = bytes.indexOf(Buffer.from("VP8 "));
    expect(chunk).toBeGreaterThan(-1);
    const width = bytes.readUInt16LE(chunk + 14) & 0x3fff;
    const height = bytes.readUInt16LE(chunk + 16) & 0x3fff;
    expect({ width, height }).toEqual({ width: 512, height: 512 });
    expect(bytes.byteLength).toBeLessThan(150_000);
  });

  it("ships correctly sized application icons and a three-size ICO", () => {
    expect(
      readPngSize(path.join(publicDirectory, "icons/favicon-16x16.png")),
    ).toEqual({ width: 16, height: 16 });
    expect(
      readPngSize(path.join(publicDirectory, "icons/favicon-32x32.png")),
    ).toEqual({ width: 32, height: 32 });
    expect(
      readPngSize(path.join(publicDirectory, "icons/apple-touch-icon.png")),
    ).toEqual({ width: 180, height: 180 });
    expect(
      readPngSize(
        path.join(publicDirectory, "icons/android-chrome-192x192.png"),
      ),
    ).toEqual({ width: 192, height: 192 });
    expect(
      readPngSize(
        path.join(publicDirectory, "icons/android-chrome-512x512.png"),
      ),
    ).toEqual({ width: 512, height: 512 });
    const ico = fs.readFileSync(
      path.join(publicDirectory, "icons/favicon.ico"),
    );
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(3);
    expect([ico[6], ico[22], ico[38]]).toEqual([16, 32, 48]);
  });
});
