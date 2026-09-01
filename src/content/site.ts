import type { SiteContent } from "./types";

export const RBC = {
  name: "RBC",
  url: "https://rbc.com",
  logo: "/assets/companies/RBC_logo.png",
  accent: "#2465c7" as const,
};

export const TaksoAI = {
  name: "TaksoAI",
  url: "https://taksoai.com",
  logo: "/assets/companies/TaksoAI_logo.png",
  accent: "#2539d8" as const,
};

export const siteContent: SiteContent = {
  status: "ready",
  seo: {
    title: "Tito Osemobor",
    description:
      "Tito Osemobor: Software Engineer, view my experience, socials, ways to get in touch and more.",
    canonicalUrl: "https://titoosemobor.com",
    socialImage: {
      path: "/social-image",
      alt: "Social preview for Tito Osemobor, a Toronto-based software engineer, featuring the cyan and navy TO monogram.",
    },
  },
  identity: {
    name: "Tito Osemobor",
    initials: "TO",
    role: "Software Engineer",
    location: "Toronto, Canada",
    avatar: "/assets/identity/tito-profile.webp",
  },
  experience: [
    {
      id: "current-company",
      company: RBC.name,
      url: RBC.url,
      logo: RBC.logo,
      accent: RBC.accent,
      positions: [
        {
          id: "current-role",
          role: "Software Engineer",
          start: "2026-05",
          end: "present",
        },
      ],
    },
    {
      id: "previous-company-one",
      company: TaksoAI.name,
      url: TaksoAI.url,
      logo: TaksoAI.logo,
      accent: TaksoAI.accent,
      positions: [
        {
          id: "previous-role-one",
          role: "Frontend Engineer",
          start: "2026-02",
          end: "2026-08",
        },
      ],
    },
    {
      id: "previous-company-two",
      company: RBC.name,
      url: RBC.url,
      logo: RBC.logo,
      accent: RBC.accent,
      positions: [
        {
          id: "previous-role-two",
          role: "Backend Engineer Intern",
          start: "2025-05",
          end: "2025-08",
        },
      ],
    },
    {
      id: "previous-company-three",
      company: RBC.name,
      url: RBC.url,
      logo: RBC.logo,
      accent: RBC.accent,
      positions: [
        {
          id: "previous-role-three",
          role: "Backend Engineer Intern",
          start: "2024-09",
          end: "2025-12",
        },
        {
          id: "previous-role-four",
          role: "Amplify Software Developer",
          start: "2024-05",
          end: "2024-08",
        },
        {
          id: "previous-role-five",
          role: "Software Developer Intern",
          start: "2024-01",
          end: "2024-04",
        },
      ],
    },
    {
      id: "previous-company-four",
      company: RBC.name,
      url: RBC.url,
      logo: RBC.logo,
      accent: RBC.accent,
      positions: [
        {
          id: "previous-role-six",
          role: "Cybersecurity Intern",
          start: "2023-05",
          end: "2023-08",
        },
      ],
    },
  ],
  projects: [],
  socials: [
    {
      platform: "github",
      label: "GitHub",
      url: "https://github.com/Tito-Osemobor",
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      url: "https://linkedin.com/in/tito-osemobor",
    },
  ],
  contact: {
    heading: "Send a message",
    introduction:
      "Have a role, project, or idea in mind? I’d be glad to hear about it.",
  },
};
