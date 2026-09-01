import Image from "next/image";
import type { CSSProperties } from "react";
import { LuChevronDown, LuExternalLink } from "react-icons/lu";
import type { CompanyExperience } from "@/content/types";
import {
  formatCompanyRange,
  formatPositionRange,
  isCurrentExperience,
} from "./experience-format";
import styles from "./experience-list.module.css";

const INITIAL_COMPANIES = 3;
type CompanyStyle = CSSProperties & Record<"--company-accent", string>;

function companyInitials(company: string): string {
  return company
    .replace(/^TODO:\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function CompanyMark({ experience }: { experience: CompanyExperience }) {
  return experience.logo ? (
    <Image
      className={styles.logo}
      src={experience.logo}
      alt=""
      width={40}
      height={40}
    />
  ) : (
    <span className={styles.monogram} aria-hidden="true">
      {companyInitials(experience.company)}
    </span>
  );
}

function CompanySummary({ experience }: { experience: CompanyExperience }) {
  const latest = experience.positions[0];
  if (!latest) return null;
  const isCurrent = isCurrentExperience(experience.positions);

  return (
    <>
      <CompanyMark experience={experience} />
      <span className={styles.summaryCopy}>
        <span className={styles.roleLine}>
          <span className={styles.role}>{latest.role}</span>
          {isCurrent ? (
            <span className={styles.currentBadge}>
              <span aria-hidden="true" />
              Current
            </span>
          ) : null}
        </span>
        <span className={styles.company}>{experience.company}</span>
      </span>
      <span className={styles.meta} data-experience-dates>
        <span>{formatCompanyRange(experience.positions)}</span>
        {experience.positions.length > 1 ? (
          <span className={styles.roleCount}>
            {experience.positions.length} roles
          </span>
        ) : null}
      </span>
    </>
  );
}

function CompanyRow({ experience }: { experience: CompanyExperience }) {
  const hasJourney = experience.positions.length > 1;
  const isCurrent = isCurrentExperience(experience.positions);
  const style: CompanyStyle = {
    "--company-accent": experience.accent ?? "#2457e6",
  };
  return (
    <article
      className={styles.companyRow}
      style={style}
      data-company-id={experience.id}
      data-current={isCurrent ? "true" : undefined}
    >
      {hasJourney ? (
        <details className={styles.journey}>
          <summary className={styles.summary}>
            <CompanySummary experience={experience} />
            <span className={styles.chevron} aria-hidden="true">
              <LuChevronDown />
            </span>
          </summary>
          <ol
            className={styles.timeline}
            aria-label={`${experience.company} roles`}
          >
            {experience.positions.map((position) => (
              <li key={position.id}>
                <span className={styles.timelineDot} aria-hidden="true" />
                <span className={styles.timelineRole}>{position.role}</span>
                <time className={styles.timelineDate}>
                  {formatPositionRange(position)}
                </time>
              </li>
            ))}
          </ol>
        </details>
      ) : (
        <div className={styles.staticSummary}>
          <CompanySummary experience={experience} />
        </div>
      )}
      {experience.url ? (
        <a
          className={`${styles.companyLink} ${hasJourney ? styles.companyLinkWithJourney : ""}`}
          href={experience.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Visit ${experience.company} website`}
          title={`Visit ${experience.company} website`}
        >
          <LuExternalLink aria-hidden="true" />
        </a>
      ) : null}
    </article>
  );
}

export function ExperienceList({
  experience,
}: {
  experience: CompanyExperience[];
}) {
  const initial = experience.slice(0, INITIAL_COMPANIES);
  const older = experience.slice(INITIAL_COMPANIES);

  return (
    <div className={styles.list}>
      {initial.map((company) => (
        <CompanyRow key={company.id} experience={company} />
      ))}
      {older.length > 0 ? (
        <details className={styles.olderCompanies}>
          <summary
            className={styles.showMore}
            aria-label={`${older.length} previous experience ${older.length === 1 ? "entry" : "entries"}`}
          >
            <span>Previous experience</span>
            <span className={styles.previousCount}>{older.length}</span>
            <LuChevronDown />
          </summary>
          <div>
            {older.map((company) => (
              <CompanyRow key={company.id} experience={company} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
