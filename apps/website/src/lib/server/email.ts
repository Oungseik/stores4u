import { createTransport } from "nodemailer";
import { SES_SMTP_HOST, SES_SMTP_PASS, SES_SMTP_PORT, SES_SMTP_USER } from "$env/static/private";

const port = Number(SES_SMTP_PORT ?? "465");

export const transporter = createTransport({
  host: SES_SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: SES_SMTP_USER,
    pass: SES_SMTP_PASS,
  },
});
