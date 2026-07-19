import { env } from "$env/dynamic/private";
import { localizePath } from "$lib/localize-path";

export type LinkPair = {
  /** Link using the incoming request origin. */
  offline: string;
  /** Link using the configured production origin. */
  online: string;
};

/**
 * Build request-origin and configured-origin versions of an auth link. Both
 * carry the same token and normally resolve to the same Worker deployment.
 *
 * `path` is a route path without the token, e.g. `/verify-email`,
 * `/reset-password`, `/magic-link/verify`, `/invite`. The token is appended as
 * a query param (matches better-auth's own convention, unifies every flow).
 */
export function buildLinks({
  token,
  path,
  requestOrigin,
}: {
  token: string;
  path: string;
  /** Full origin (scheme + host [:port]) from the incoming request —
   * `new URL(request.url).origin` or `event.url.origin`. */
  requestOrigin: string;
}): LinkPair {
  const localizedPath = localizePath(path);
  const sep = localizedPath.includes("?") ? "&" : "?";
  const rest = `${localizedPath}${sep}token=${encodeURIComponent(token)}`;
  const offline = `${requestOrigin.replace(/\/$/, "")}${rest}`;
  const online = `${(env.BETTER_AUTH_URL || requestOrigin).replace(/\/$/, "")}${rest}`;
  return { offline, online };
}
