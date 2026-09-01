export type SiteStatus = "draft" | "ready";
export type YearMonth = `${number}-${number}`;
export type SocialPlatform = "github" | "linkedin";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  url: string;
};

export type ExperiencePosition = {
  id: string;
  role: string;
  start: YearMonth;
  end: YearMonth | "present";
};

export type CompanyExperience = {
  id: string;
  company: string;
  positions: ExperiencePosition[];
  url?: string;
  logo?: string;
  accent?: `#${string}`;
};

export type GitHubRepository = `${string}/${string}`;

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  primaryUrl: string;
  featured: boolean;
  githubRepo?: GitHubRepository;
  accent?: `#${string}`;
  imageFocalPoint?: { x: number; y: number };
};

export type SeoContent = {
  title: string;
  description: string;
  canonicalUrl: string;
  socialImage: {
    path: `/${string}`;
    alt: string;
  };
};

export type SiteContent = {
  status: SiteStatus;
  seo: SeoContent;
  identity: {
    name: string;
    initials: string;
    role: string;
    location: string;
    avatar?: string;
  };
  experience: CompanyExperience[];
  projects: Project[];
  socials: SocialLink[];
  contact: {
    heading: string;
    introduction: string;
  };
};
