"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTheme } from "next-themes";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  LuCheck,
  LuMonitor,
  LuMoon,
  LuSparkles,
  LuSun,
  LuX,
} from "react-icons/lu";
import { FaLinkedinIn } from "react-icons/fa6";
import { SiGithub } from "react-icons/si";
import type { SocialLink, SocialPlatform } from "@/content/types";
import styles from "./site-controls.module.css";

const emptySubscribe = () => () => undefined;
type ThemeValue = "system" | "light" | "dark";
type ControlVariant = "dock" | "footer";

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  return platform === "github" ? <SiGithub /> : <FaLinkedinIn />;
}

function ThemeIcon({ theme }: { theme: ThemeValue }) {
  if (theme === "light") return <LuSun />;
  if (theme === "dark") return <LuMoon />;
  return <LuMonitor />;
}

function ActionContent({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <>
      <span className={styles.actionIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.actionLabel}>{label}</span>
    </>
  );
}

function ControlItems({
  socials,
  enabled,
  variant,
}: {
  socials: SocialLink[];
  enabled: boolean;
  variant: ControlVariant;
}) {
  const { theme = "system", setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const currentTheme = mounted ? theme : "system";
  const themes: ThemeValue[] = ["system", "light", "dark"];

  return (
    <div
      className={`${styles.controlItems} ${variant === "dock" ? styles.dockItems : styles.footerItems}`}
    >
      <div className={styles.controlGroup} aria-label="Social links">
        {socials.map((social) => (
          <a
            key={social.platform}
            className={styles.action}
            href={social.url}
            target="_blank"
            rel="noreferrer"
            aria-label={social.label}
            title={social.label}
            tabIndex={enabled ? 0 : -1}
          >
            <ActionContent
              icon={<SocialIcon platform={social.platform} />}
              label={social.label}
            />
          </a>
        ))}
      </div>
      <span className={styles.divider} aria-hidden="true" />
      <div className={styles.controlGroup} aria-label="Color theme">
        {themes.map((value) => {
          const label = `${value[0]?.toUpperCase()}${value.slice(1)}`;
          const selected = currentTheme === value;
          return (
            <button
              key={value}
              type="button"
              className={styles.action}
              aria-label={`Use ${value} theme`}
              aria-pressed={selected}
              title={`${label} theme`}
              tabIndex={enabled ? 0 : -1}
              onClick={() => setTheme(value)}
            >
              <ActionContent icon={<ThemeIcon theme={value} />} label={label} />
              {selected ? (
                <LuCheck className={styles.selectedIcon} aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SiteControls({ socials }: { socials: SocialLink[] }) {
  const [open, setOpen] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const [pendingFooter, setPendingFooter] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openedByHover = useRef(false);
  const dismissedWhileHovered = useRef(false);
  const suppressFocusOpen = useRef(false);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersects = Boolean(entry?.isIntersecting);
        if (intersects && dockRef.current?.contains(document.activeElement)) {
          setPendingFooter(true);
          return;
        }
        setPendingFooter(false);
        setAtFooter(intersects);
        if (intersects) setOpen(false);
      },
      { threshold: 0.45 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (dockRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      if (pendingFooter) {
        (document.activeElement as HTMLElement | null)?.blur();
        setPendingFooter(false);
        setAtFooter(true);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dismissedWhileHovered.current = true;
      suppressFocusOpen.current = true;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, pendingFooter]);

  const closeAfterFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setOpen(false);
    if (pendingFooter) {
      setPendingFooter(false);
      setAtFooter(true);
    }
  };

  const closeAfterPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === "mouse" &&
      !event.currentTarget.contains(document.activeElement)
    ) {
      setOpen(false);
    }
  };

  return (
    <>
      <div
        ref={footerRef}
        className={`${styles.footerControls} ${atFooter ? styles.footerControlsVisible : ""}`}
        aria-hidden={!atFooter}
        inert={!atFooter}
        data-testid="footer-controls"
      >
        <ControlItems socials={socials} enabled={atFooter} variant="footer" />
      </div>
      <div
        ref={dockRef}
        className={`${styles.dock} ${atFooter ? styles.dockHidden : ""}`}
        aria-hidden={atFooter}
        inert={atFooter}
        data-testid="spark-dock"
        onPointerEnter={(event) => {
          if (
            event.pointerType === "mouse" &&
            !open &&
            !dismissedWhileHovered.current
          ) {
            openedByHover.current = true;
            setOpen(true);
          }
        }}
        onPointerLeave={(event) => {
          openedByHover.current = false;
          dismissedWhileHovered.current = false;
          closeAfterPointer(event);
        }}
        onFocusCapture={() => {
          if (suppressFocusOpen.current) {
            suppressFocusOpen.current = false;
            return;
          }
          dismissedWhileHovered.current = false;
          setOpen(true);
        }}
        onBlurCapture={closeAfterFocus}
      >
        <AnimatePresence initial={false}>
          {open && !atFooter ? (
            <m.div
              className={styles.panel}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <ControlItems socials={socials} enabled variant="dock" />
            </m.div>
          ) : null}
        </AnimatePresence>
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-label={open ? "Close site controls" : "Open site controls"}
          aria-expanded={open}
          tabIndex={atFooter ? -1 : 0}
          onClick={() => {
            if (openedByHover.current) {
              openedByHover.current = false;
              setOpen(true);
              return;
            }
            setOpen((value) => {
              dismissedWhileHovered.current = value;
              return !value;
            });
          }}
        >
          {open ? <LuX /> : <LuSparkles />}
        </button>
      </div>
    </>
  );
}
