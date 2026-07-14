import nodemailer from "nodemailer";
import { logger } from "$lib/server/logger";

// Optional env: offline / local-dev deploys have no SMTP. Use dynamic so a
// missing var never breaks the build or `bun run dev`.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE, SMTP_FROM } = process.env;

export const isEmailConfigured = Boolean(SMTP_HOST);

let transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter | null {
  if (!SMTP_HOST) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD ?? "" } : undefined,
    });
  }
  return transport;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type AuthEmailInput = {
  email: string;
  subject: string;
  /** The full link (already contains the token). */
  url: string;
  /** Optionally the bare token, if you want it shown separately. */
  token?: string;
};

/** Shared HTML body for all auth flows (verify / reset / magic-link). */
function renderAuthHtml(subject: string, url: string, token?: string): string {
  const tokenLine = token ? `\n<p>Or enter this code: <code>${token}</code></p>` : "";
  return `<h2>${subject}</h2><p><a href="${url}">${url}</a></p>${tokenLine}`;
}

/**
 * Send an auth flow email (verify / reset / magic-link).
 * Never throws: logs on failure, returns false. The caller always renders a
 * copyable link pair as fallback, so a send failure never blocks the user.
 */
export async function sendAuthEmail(input: AuthEmailInput): Promise<boolean> {
  return sendEmail({
    to: input.email,
    subject: input.subject,
    text: `${input.subject}\n${input.url}`,
    html: renderAuthHtml(input.subject, input.url, input.token),
  });
}

/**
 * Best-effort email send. Never throws: logs on failure and returns false.
 * Callers must not depend on success — every email flow also renders a
 * copyable link pair (offline + online) so an SMTP / internet blip never
 * blocks the user.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const t = getTransport();
  if (!t) {
    logger.warn({ to: input.to, subject: input.subject }, "email skipped: SMTP not configured");
    return false;
  }
  try {
    await t.sendMail({
      from: SMTP_FROM || SMTP_USER || "no-reply@localhost",
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (err) {
    logger.error({ err, to: input.to, subject: input.subject }, "email send failed");
    return false;
  }
}
