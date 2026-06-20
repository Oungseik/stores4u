import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logger } from "$lib/server/logger";
import { rateLimiter } from "$lib/server/rate-limit";

const firstRunAuthPaths = [
  "/api/auth/sign-up/email",
  "/api/auth/sign-in/email",
  "/api/auth/sign-in/social",
  "/api/auth/verify-email",
  "/api/auth/get-session",
];

/**
 * First-run + setup gate. Single source of truth for reachability:
 * - No users yet → /setup and first-owner auth endpoints are open.
 * - Users but no shop → auth routes and /setup stay open so the owner can
 *   finish store setup after OAuth.
 * - Shop exists → /setup and public signup are closed.
 */
const setupGate: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const firstUser = await db.query.user.findFirst({ columns: { id: true } });
  const existingShop = await db.query.shop.findFirst({ columns: { id: true } });

  const lastSegment = path.slice(path.lastIndexOf("/") + 1);
  const isStaticAsset = lastSegment.includes(".") || path.startsWith("/_app/");

  if (!firstUser) {
    if (path === "/setup" || path === "/health" || isStaticAsset) {
      return resolve(event);
    }

    if (path.startsWith("/api/auth/")) {
      return firstRunAuthPaths.includes(path) || path.startsWith("/api/auth/callback/")
        ? resolve(event)
        : redirect(303, "/setup");
    }

    return redirect(303, "/setup");
  }

  if (!existingShop) {
    if (
      path === "/setup" ||
      path === "/signin" ||
      path.startsWith("/verify-account") ||
      path.startsWith("/forgot-password") ||
      path === "/health" ||
      isStaticAsset ||
      path.startsWith("/api/auth/")
    ) {
      return resolve(event);
    }

    return redirect(303, "/setup");
  }

  if (path === "/setup" || path === "/api/auth/sign-up/email") {
    return redirect(303, "/");
  }

  return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace("%paraglide.lang%", locale),
    });
  });

const rateLimitHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/queue/")) {
    return resolve(event);
  }

  const clientIP = event.request.headers.get("X-Forwarded-For");
  if (clientIP === null) {
    return resolve(event);
  }

  const cost = event.request.method === "GET" || event.request.method === "OPTIONS" ? 1 : 2;
  try {
    await rateLimiter.consume(clientIP, cost);
  } catch (_error) {
    return new Response("Too many requests", { status: 429 });
  }

  return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/auth")) {
    return svelteKitHandler({ event, resolve, auth, building });
  }

  if (event.url.pathname.startsWith("/api/queue/")) {
    return resolve(event);
  }

  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = session;

  if (session?.user?.id && event.tracing?.root) {
    event.tracing.root.setAttribute("userId", session.user.id);
    event.tracing.root.setAttribute("userEmail", session.user.email);
  }

  return resolve(event);
};

const loggingHandle: Handle = async ({ event, resolve }) => {
  event.locals.logger = logger.child({
    requestId: crypto.randomUUID(),
    path: event.url.pathname,
    method: event.request.method,
  });

  return resolve(event);
};

export const handle: Handle = sequence(loggingHandle, rateLimitHandle, handleParaglide, setupGate, authHandle);
