import Image from "next/image";
import type { SiteContent } from "@/content/types";
import styles from "./identity-masthead.module.css";

type Identity = SiteContent["identity"];

export function IdentityMasthead({ identity }: { identity: Identity }) {
  return (
    <header className={styles.masthead}>
      <div className={styles.portraitFrame}>
        {identity.avatar ? (
          <Image
            className={styles.portrait}
            src={identity.avatar}
            alt={`${identity.name} portrait`}
            width={112}
            height={112}
            priority
          />
        ) : (
          <span className={styles.fallback} aria-hidden="true">
            {identity.initials}
          </span>
        )}
      </div>
      <div>
        <h1 className={styles.name}>{identity.name}</h1>
        <p className={styles.details}>
          <span>{identity.role}</span>
          <span className={styles.separator} aria-hidden="true" />
          <span>{identity.location}</span>
        </p>
      </div>
    </header>
  );
}
