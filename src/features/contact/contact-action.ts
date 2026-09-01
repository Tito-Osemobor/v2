"use server";

import {
  deliverContactMessage,
  parseContactFormData,
  type ContactFormState,
} from "./contact";
import {
  canUseDevelopmentTransport,
  createDevelopmentTransport,
  createResendTransport,
} from "./contact-transport";

export async function submitContact(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = parseContactFormData(formData);
  if (!parsed.success) return parsed.state;

  const useDevelopmentTransport = canUseDevelopmentTransport({
    nodeEnv: process.env.NODE_ENV,
    e2eTest: process.env.E2E_TEST,
  });
  const send = useDevelopmentTransport
    ? createDevelopmentTransport(formData.get("_e2eMode"))
    : createResendTransport(process.env.RESEND_API_KEY);

  return deliverContactMessage(
    parsed.data,
    {
      apiKey: process.env.RESEND_API_KEY,
      to: process.env.CONTACT_TO_EMAIL,
      from: process.env.CONTACT_FROM_EMAIL,
    },
    send,
  );
}
