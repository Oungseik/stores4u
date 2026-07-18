import * as messages from "$lib/paraglide/messages";

type MessageValues = Record<string, string | number | boolean>;
type ErrorLike = {
  code?: unknown;
  data?: unknown;
  message?: unknown;
};

type MessageFunction = (values?: MessageValues) => string;

const messageFunctions = messages as unknown as Record<string, MessageFunction>;
const authErrorKeys: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "error_email_not_verified",
  INVALID_EMAIL_OR_PASSWORD: "error_invalid_credentials",
  INVALID_PASSWORD: "error_invalid_credentials",
  SESSION_EXPIRED: "error_session_expired",
  USER_NOT_FOUND: "error_user_not_found",
};

export function localizeError(error: unknown, fallbackKey = "something_went_wrong"): string {
  const candidate = error as ErrorLike | null;
  const data = candidate?.data as { key?: unknown; values?: unknown } | null;
  const key =
    (typeof data?.key === "string" && data.key) ||
    (typeof candidate?.code === "string" && authErrorKeys[candidate.code]) ||
    (typeof candidate?.message === "string" &&
      messageFunctions[candidate.message] &&
      candidate.message) ||
    fallbackKey;
  const message = messageFunctions[key] ?? messageFunctions[fallbackKey];

  if (!message) return messages.something_went_wrong();

  try {
    return message(
      data?.values && typeof data.values === "object" ? (data.values as MessageValues) : undefined,
    );
  } catch {
    return messages.something_went_wrong();
  }
}
