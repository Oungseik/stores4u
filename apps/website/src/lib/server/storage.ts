import { getRequestEvent } from "$app/server";
import type { R2Bucket } from "@cloudflare/workers-types";

export const STORAGE_PREFIX = "/storage";

const SAFE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function getBucket(): R2Bucket {
  const bucket = getRequestEvent().platform?.env.STORAGE;
  if (!bucket) throw new Error("Cloudflare R2 binding STORAGE is unavailable");
  return bucket;
}

export function isSafeObjectKey(key: string): boolean {
  return (
    key.length > 0 &&
    !key.startsWith("/") &&
    !key.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  );
}

export function storageContentType(key: string): string {
  const dot = key.lastIndexOf(".");
  const extension = dot < 0 ? "" : key.slice(dot).toLowerCase();
  return SAFE_CONTENT_TYPES[extension] ?? "application/octet-stream";
}

export function storageResponseHeaders(key: string): Record<string, string> {
  const contentType = storageContentType(key);
  const headers: Record<string, string> = {
    "Cache-Control": "private, max-age=3600",
    "Content-Security-Policy": "sandbox; default-src 'none'",
    "Content-Type": contentType,
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
  };
  if (contentType === "application/octet-stream") headers["Content-Disposition"] = "attachment";
  return headers;
}

export function getObjectUrl(key: string): string {
  return `${STORAGE_PREFIX}/${key}`;
}

export function presignDownload(key: string, _expiresIn = 900): string {
  return getObjectUrl(key);
}

export async function putObject(key: string, data: Uint8Array): Promise<void> {
  if (!isSafeObjectKey(key)) throw new Error(`Invalid storage key: ${key}`);
  await getBucket().put(key, data, { httpMetadata: { contentType: storageContentType(key) } });
}

export async function getObject(key: string): Promise<Buffer> {
  if (!isSafeObjectKey(key)) throw new Error(`Invalid storage key: ${key}`);
  const object = await getBucket().get(key);
  if (!object) throw new Error(`Stored object not found: ${key}`);
  return Buffer.from(await object.arrayBuffer());
}

export async function getObjectStream(key: string): Promise<ReadableStream | null> {
  if (!isSafeObjectKey(key)) return null;
  return ((await getBucket().get(key))?.body as unknown as ReadableStream | undefined) ?? null;
}

export async function deleteObject(key: string): Promise<void> {
  if (!isSafeObjectKey(key)) throw new Error(`Invalid storage key: ${key}`);
  await getBucket().delete(key);
}

export async function removeImage(key: string): Promise<boolean> {
  await deleteObject(key);
  return true;
}

export function extractObjectKey(objectPath: string): string | null {
  if (!objectPath) return null;

  let pathname = objectPath;
  try {
    pathname = new URL(objectPath).pathname;
  } catch {
    // Relative app URL.
  }

  if (!pathname.startsWith(`${STORAGE_PREFIX}/`)) return null;
  const key = pathname.slice(STORAGE_PREFIX.length + 1);
  return isSafeObjectKey(key) ? key : null;
}
