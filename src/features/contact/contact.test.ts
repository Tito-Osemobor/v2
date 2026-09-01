import { describe, expect, it, vi } from "vitest";
import {
  buildContactEmail,
  contactSchema,
  deliverContactMessage,
  parseContactFormData,
  providerErrorStatus,
  type ContactInput,
} from "./contact";
import { canUseDevelopmentTransport } from "./contact-transport";

const validInput: ContactInput = {
  name: "Tito Visitor",
  email: "visitor@example.com",
  subject: "Project enquiry",
  message: "I would like to discuss a thoughtful new project.",
  website: "",
};
const configuration = {
  apiKey: "test-key",
  to: "private@example.com",
  from: "Portfolio <website@example.com>",
};

function toFormData(values: Partial<ContactInput> = {}) {
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...validInput, ...values })) {
    formData.set(key, value);
  }
  return formData;
}

describe("contact form", () => {
  it("normalizes valid server-side form values", () => {
    const result = parseContactFormData(
      toFormData({ name: "  Tito    Visitor ", email: "USER@Example.COM " }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          name: "Tito Visitor",
          email: "user@example.com",
        }),
      }),
    );
  });

  it("rejects the honeypot and unsafe or oversized values", () => {
    expect(
      contactSchema.safeParse({ ...validInput, website: "bot" }).success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({ ...validInput, subject: "hello\nBcc:" })
        .success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({ ...validInput, message: "<b>hello there</b>" })
        .success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({ ...validInput, message: "a".repeat(5_001) })
        .success,
    ).toBe(false);
  });

  it("returns field-specific validation errors", () => {
    const result = parseContactFormData(toFormData({ email: "invalid" }));
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        state: expect.objectContaining({
          status: "validation",
          errors: expect.objectContaining({ email: expect.any(Array) }),
        }),
      }),
    );
  });

  it("builds a plain-text payload with reply-to and no destination", () => {
    const email = buildContactEmail(validInput);
    expect(email.replyTo).toBe(validInput.email);
    expect(email.subject).toBe("Portfolio contact: Project enquiry");
    expect(email.text).toContain(validInput.message);
    expect(email).not.toHaveProperty("to");
  });

  it("does not call Resend when configuration is incomplete", async () => {
    const send = vi.fn();
    const state = await deliverContactMessage(
      validInput,
      { apiKey: undefined, to: undefined, from: undefined },
      send,
    );
    expect(state.status).toBe("unavailable");
    expect(send).not.toHaveBeenCalled();
  });

  it("sends to the private destination with the visitor as reply-to", async () => {
    const send = vi.fn(async () => ({}));
    const state = await deliverContactMessage(validInput, configuration, send);
    expect(state.status).toBe("success");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["private@example.com"],
        replyTo: "visitor@example.com",
      }),
    );
  });

  it.each([
    "validation_error",
    "domain_not_verified",
    "invalid_api_key",
    "invalid_from_address",
    "monthly_quota_exceeded",
  ])("treats provider configuration code %s as unavailable", async (code) => {
    const send = vi.fn(async () => ({ error: { code, statusCode: 403 } }));
    const state = await deliverContactMessage(validInput, configuration, send);
    expect(state.status).toBe("unavailable");
    expect(state.message).not.toContain(code);
  });

  it.each(["rate_limit_exceeded", "application_error", "unknown_error"])(
    "treats provider delivery code %s as retryable",
    async (code) => {
      const send = vi.fn(async () => ({ error: { code, statusCode: 500 } }));
      const state = await deliverContactMessage(
        validInput,
        configuration,
        send,
      );
      expect(state.status).toBe("retryable");
      expect(state.message).not.toContain(code);
    },
  );

  it("classifies credential and rate-limit status codes safely", () => {
    expect(
      providerErrorStatus({ code: "unknown_auth_error", statusCode: 401 }),
    ).toBe("unavailable");
    expect(
      providerErrorStatus({ code: "unknown_rate_error", statusCode: 429 }),
    ).toBe("retryable");
  });

  it("returns a safe retryable state when delivery throws", async () => {
    const send = vi.fn(async () => {
      throw new Error("provider detail");
    });
    const state = await deliverContactMessage(validInput, configuration, send);
    expect(state).toEqual({
      status: "retryable",
      message: "Your message could not be sent. Please try again in a moment.",
    });
    expect(state.message).not.toContain("provider detail");
  });

  it("never enables the mock transport in production", () => {
    expect(
      canUseDevelopmentTransport({ nodeEnv: "production", e2eTest: "1" }),
    ).toBe(false);
    expect(
      canUseDevelopmentTransport({ nodeEnv: "development", e2eTest: "1" }),
    ).toBe(true);
    expect(providerErrorStatus({ code: "rate_limit_exceeded" })).toBe(
      "retryable",
    );
  });
});
