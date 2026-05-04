import { createTransport, type Transporter } from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export const createTransporter = (config: SmtpConfig) => {
  return createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

export const createEmailCallbacks = (transporter: Transporter, noReplyEmail: string) => {
  return {
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to: user.email,
        subject: "Verify your email",
        html: `verify your email with ${url}`,
      });
    },
    sendVerificationOTP: async ({
      email,
      otp,
      type,
    }: {
      email: string;
      otp: string;
      type: string;
    }) => {
      if (type === "forget-password") {
        await transporter.sendMail({
          from: noReplyEmail,
          to: email,
          subject: "Reset password",
          html: `OTP for reset password ${otp}`,
        });
      }
    },
    sendTwoFactorOTP: async ({ user, otp }: { user: { email: string }; otp: string }) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to: user.email,
        subject: "Your verification code",
        html: `OTP is ${otp}`,
      });
    },
  };
};
