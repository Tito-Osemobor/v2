import Image from "next/image";
import type { CSSProperties } from "react";
import { LuArrowUpRight, LuChevronDown, LuStar } from "react-icons/lu";
import { SiGithub } from "react-icons/si";
import type { GitHubRepository, Project } from "@/content/types";
import { formatStarCount } from "./github-core";
import styles from "./project-list.module.css";

const INITIAL_PROJECTS = 3;
type AccentStyle = CSSProperties & Record<"--project-accent", string>;

function StarCount({ count }: { count: number }) {
  const exact = count.toLocaleString("en");
  return (
    <span
      className={styles.starCount}
      aria-label={`${exact} GitHub ${count === 1 ? "star" : "stars"}`}
      title={`${exact} GitHub ${count === 1 ? "star" : "stars"}`}
    >
      <LuStar />
      <span aria-hidden="true">{formatStarCount(count)}</span>
    </span>
  );
}

function ProjectRow({
  project,
  starCount,
  priority,
}: {
  project: Project;
  starCount: number | null | undefined;
  priority: boolean;
}) {
  const style: AccentStyle = {
    "--project-accent": project.accent ?? "#2563eb",
  };
  const focalPoint = project.imageFocalPoint ?? { x: 50, y: 50 };

  return (
    <article
      className={styles.row}
      style={style}
      data-project-slug={project.slug}
    >
      <a
        className={styles.imageLink}
        href={project.primaryUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${project.title}`}
      >
        <Image
          className={styles.image}
          src={project.image}
          alt=""
          width={224}
          height={144}
          priority={priority}
          unoptimized={project.image.endsWith(".svg")}
          style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
        />
      </a>
      <div className={styles.copy}>
        <div className={styles.headingRow}>
          <h3>
            <a href={project.primaryUrl} target="_blank" rel="noreferrer">
              {project.title} <LuArrowUpRight />
            </a>
          </h3>
          {project.githubRepo ? (
            <a
              className={styles.githubLink}
              href={`https://github.com/${project.githubRepo}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`View ${project.title} source on GitHub`}
            >
              <SiGithub aria-hidden="true" focusable="false" />
              {typeof starCount === "number" ? (
                <StarCount count={starCount} />
              ) : null}
            </a>
          ) : null}
        </div>
        <p>{project.description}</p>
        <ul className={styles.technologies} aria-label="Technologies">
          {project.technologies.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function ProjectList({
  projects,
  stars,
}: {
  projects: Project[];
  stars: Record<string, number | null>;
}) {
  const initial = projects.slice(0, INITIAL_PROJECTS);
  const additional = projects.slice(INITIAL_PROJECTS);

  const row = (project: Project, priority = false) => (
    <ProjectRow
      key={project.slug}
      project={project}
      starCount={
        project.githubRepo
          ? stars[project.githubRepo as GitHubRepository]
          : undefined
      }
      priority={priority}
    />
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.list}>
        {initial.map((project, index) => row(project, index === 0))}
        {additional.length > 0 ? (
          <details className={styles.additional}>
            <summary className={styles.showMore}>
              <span>
                Show {additional.length} more project
                {additional.length === 1 ? "" : "s"}
              </span>
              <LuChevronDown />
            </summary>
            <div>{additional.map((project) => row(project))}</div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
