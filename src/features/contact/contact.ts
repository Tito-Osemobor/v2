import { z } from "zod";

const normalizeSingleLine = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const plainText = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => !/[<>]/.test(value), `${label} must be plain text.`);

export const contactSchema = z.object({
  name: plainText("Name")
    .min(2, "Please enter your name.")
    .max(80, "Name must be 80 characters or fewer.")
    .transform(normalizeSingleLine),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email("Enter a valid email address.")
        .max(254, "Email address is too long."),
    ),
  subject: plainText("Subject")
    .min(3, "Subject must be at least 3 characters.")
    .max(120, "Subject must be 120 characters or fewer.")
    .refine((value) => !/[\r\n]/.test(value), "Subject must be a single line.")
    .transform(normalizeSingleLine),
  message: plainText("Message")
    .min(10, "Message must be at least 10 characters.")
    .max(5_000, "Message must be 5,000 characters or fewer."),
  website: z.string().max(0, "Automated submission rejected."),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;
export type ContactFormState = {
  status: "idle" | "success" | "validation" | "unavailable" | "retryable";
  message: string;
  errors?: Partial<Record<ContactField, string[]>>;
};

export const initialContactState: ContactFormState = {
  status: "idle",
  message: "",
};

export function parseContactFormData(
  formData: FormData,
):
  | { success: true; data: ContactInput }
  | { success: false; state: ContactFormState } {
  const result = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });
  if (result.success) return result;
  return {
    success: false,
    state: {
      status: "validation",
      message: "Please review the highlighted fields.",
      errors: result.error.flatten().fieldErrors,
    },
  };
}

export type ContactConfiguration = {
  apiKey: string | undefined;
  to: string | undefined;
  from: string | undefined;
};
export type ContactProviderError = {
  code: string;
  statusCode?: number | null;
};
export type SendEmail = (payload: {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  text: string;
}) => Promise<{ error?: ContactProviderError | null }>;

const unavailableProviderCodes = new Set([
  "daily_quota_exceeded",
  "domain_not_verified",
  "invalid_access",
  "invalid_api_key",
  "invalid_from_address",
  "invalid_parameter",
  "invalid_region",
  "method_not_allowed",
  "missing_api_key",
  "missing_required_field",
  "monthly_quota_exceeded",
  "not_found",
  "permission_denied",
  "quota_exceeded",
  "restricted_api_key",
  "security_error",
  "sender_not_verified",
  "validation_error",
]);

export function providerErrorStatus(
  error: ContactProviderError,
): "unavailable" | "retryable" {
  if (unavailableProviderCodes.has(error.code)) return "unavailable";
  if (
    error.statusCode !== null &&
    error.statusCode !== undefined &&
    [400, 401, 402, 403, 404, 405, 422].includes(error.statusCode)
  ) {
    return "unavailable";
  }
  return "retryable";
}

export const buildContactEmail = (input: ContactInput) => ({
  replyTo: input.email,
  subject: `Portfolio contact: ${input.subject}`,
  text: [
    `Name: ${input.name}`,
    `Reply email: ${input.email}`,
    `Subject: ${input.subject}`,
    "",
    input.message,
  ].join("\n"),
});

export async function deliverContactMessage(
  input: ContactInput,
  configuration: ContactConfiguration,
  send: SendEmail,
): Promise<ContactFormState> {
  if (!configuration.apiKey || !configuration.to || !configuration.from) {
    return {
      status: "unavailable",
      message:
        "The contact form is not configured yet. Please try again later.",
    };
  }
  try {
    const email = buildContactEmail(input);
    const result = await send({
      from: configuration.from,
      to: [configuration.to],
      ...email,
    });
    if (result.error) {
      const status = providerErrorStatus(result.error);
      return status === "unavailable"
        ? {
            status,
            message:
              "The contact form is temporarily unavailable. Please try again later.",
          }
        : {
            status,
            message:
              "Your message could not be sent. Please try again in a moment.",
          };
    }
    return {
      status: "success",
      message: "Thanks — your message has been sent.",
    };
  } catch {
    return {
      status: "retryable",
      message: "Your message could not be sent. Please try again in a moment.",
    };
  }
}
