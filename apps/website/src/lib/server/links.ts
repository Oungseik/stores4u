import { BETTER_AUTH_URL } from "$env/static/private";
import { localizePath } from "$lib/localize-path";

export type LinkPair = {
  /** Same-host link — reachable on LAN / offline from the request's origin. */
  offline: string;
  /** Public link from BETTER_AUTH_URL — reachable over the internet. */
  online: string;
};

/**
 * Build the offline (request origin = LAN host) and online (BETTER_AUTH_URL)
 * versions of an auth link. Both carry the same token, so the recipient uses
 * whichever network is reachable — owner hands the offline link to staff on
 * the same wifi when the internet is down, the online one otherwise.
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
  const online = `${BETTER_AUTH_URL.replace(/\/$/, "")}${rest}`;
  return { offline, online };
}
