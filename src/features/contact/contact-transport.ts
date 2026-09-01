import { Resend } from "resend";
import type { SendEmail } from "./contact";

export type ContactRuntime = {
  nodeEnv: string | undefined;
  e2eTest: string | undefined;
};

export function canUseDevelopmentTransport(runtime: ContactRuntime): boolean {
  return runtime.nodeEnv === "development" && runtime.e2eTest === "1";
}

export function createDevelopmentTransport(
  mode: FormDataEntryValue | null,
): SendEmail {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mode === "retryable"
      ? { error: { code: "application_error", statusCode: 500 } }
      : { error: null };
  };
}

export function createResendTransport(apiKey: string | undefined): SendEmail {
  const resend = new Resend(apiKey);
  return async (payload) => {
    const result = await resend.emails.send(payload);
    return {
      error: result.error
        ? {
            code: result.error.name,
            statusCode: result.error.statusCode,
          }
        : null,
    };
  };
}
