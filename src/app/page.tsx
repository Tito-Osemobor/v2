import { ContactForm } from "@/features/contact/contact-form";
import { ExperienceList } from "@/features/experience/experience-list";
import { IdentityMasthead } from "@/features/identity/identity-masthead";
import { getGitHubStars } from "@/features/projects/github";
import { ProjectList } from "@/features/projects/project-list";
import { SiteControls } from "@/features/site-controls/site-controls";
import { siteContent } from "@/content/site";
import styles from "./page.module.css";

export default async function HomePage() {
  const hasProjects = siteContent.projects.length > 0;
  const repositories = siteContent.projects.flatMap((project) =>
    project.githubRepo ? [project.githubRepo] : [],
  );
  const starRecord = hasProjects
    ? Object.fromEntries(await getGitHubStars(repositories))
    : {};

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-shell">
        <IdentityMasthead identity={siteContent.identity} />

        <main id="main-content">
          <section
            className={`${styles.section} ${styles.reveal}`}
            aria-labelledby="work-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionLabel}>Work</span>
              <h2 id="work-heading">Now &amp; before</h2>
            </div>
            <ExperienceList experience={siteContent.experience} />
          </section>

          {hasProjects ? (
            <section
              className={`${styles.section} ${styles.reveal}`}
              aria-labelledby="projects-heading"
            >
              <div className={styles.sectionHeading}>
                <span className={styles.sectionLabel}>Selected</span>
                <h2 id="projects-heading">Projects</h2>
              </div>
              <ProjectList projects={siteContent.projects} stars={starRecord} />
            </section>
          ) : null}

          <section
            className={`${styles.section} ${styles.contactSection} ${styles.reveal}`}
            aria-labelledby="contact-heading"
          >
            <div className={styles.sectionHeading}>
              <span className={styles.sectionLabel}>Contact</span>
              <div>
                <h2 id="contact-heading">{siteContent.contact.heading}</h2>
                <p>{siteContent.contact.introduction}</p>
              </div>
            </div>
            <ContactForm />
          </section>
        </main>

        <footer className={styles.footer}>
          <p>
            © {new Date().getFullYear()} {siteContent.identity.name}
          </p>
          <noscript>
            <ul className={styles.noScriptSocials} aria-label="Social links">
              {siteContent.socials.map((social) => (
                <li key={social.platform}>
                  <a href={social.url} target="_blank" rel="noreferrer">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </noscript>
          <SiteControls socials={siteContent.socials} />
        </footer>
      </div>
    </>
  );
}
