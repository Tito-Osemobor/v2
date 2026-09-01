"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { LuArrowUpRight } from "react-icons/lu";
import { submitContact } from "./contact-action";
import {
  initialContactState,
  type ContactField,
  type ContactFormState,
} from "./contact";
import styles from "./contact-form.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send message"}
      <LuArrowUpRight />
    </button>
  );
}

function FieldError({
  field,
  state,
}: {
  field: ContactField;
  state: ContactFormState;
}) {
  const message = state.errors?.[field]?.[0];
  return message ? (
    <span className={styles.fieldError} id={`${field}-error`}>
      {message}
    </span>
  ) : null;
}

export function ContactForm() {
  const [state, formAction] = useActionState(
    submitContact,
    initialContactState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const describedBy = (field: ContactField) =>
    state.errors?.[field] ? `${field}-error` : undefined;

  return (
    <form ref={formRef} action={formAction} className={styles.form} noValidate>
      <div className={styles.grid}>
        <label>
          <span>Name</span>
          <input
            className={styles.control}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={80}
            required
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={describedBy("name")}
          />
          <FieldError field="name" state={state} />
        </label>
        <label>
          <span>Email</span>
          <input
            className={styles.control}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={describedBy("email")}
          />
          <FieldError field="email" state={state} />
        </label>
      </div>
      <label>
        <span>Subject</span>
        <input
          className={styles.control}
          name="subject"
          type="text"
          maxLength={120}
          required
          aria-invalid={Boolean(state.errors?.subject)}
          aria-describedby={describedBy("subject")}
        />
        <FieldError field="subject" state={state} />
      </label>
      <label>
        <span>Message</span>
        <textarea
          className={styles.control}
          name="message"
          rows={6}
          maxLength={5_000}
          required
          aria-invalid={Boolean(state.errors?.message)}
          aria-describedby={describedBy("message")}
        />
        <FieldError field="message" state={state} />
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      <div className={styles.footer}>
        <p
          className={`${styles.status} ${styles[state.status]}`}
          role={state.status === "success" ? "status" : "alert"}
          aria-live="polite"
        >
          {state.message}
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
