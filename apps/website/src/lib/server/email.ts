import { logger } from "$lib/server/logger";

export const isEmailConfigured = false;

export type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type AuthEmailInput = {
  email: string;
  subject: string;
  url: string;
  token?: string;
};

export async function sendAuthEmail(input: AuthEmailInput): Promise<boolean> {
  return sendEmail({
    to: input.email,
    subject: input.subject,
    text: `${input.subject}\n${input.url}`,
  });
}

/** Email delivery is not configured on the server yet; auth links remain copyable in the UI. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  logger.warn(
    { to: input.to, subject: input.subject },
    "email skipped: no HTTP email provider configured",
  );
  return false;
}
