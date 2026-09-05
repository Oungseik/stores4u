import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { env } from "$env/dynamic/private";

export const STORAGE_PREFIX = "/storage";

const SAFE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

// ponytail: local-disk storage for the single-VM deployment; no replication or offsite backups.
// If disk durability ever matters, swap these four functions for S3/R2 over HTTP.
function getStorageDir(): string {
  return env.STORAGE_DIR || path.join(process.cwd(), ".storage");
}

export function isSafeObjectKey(key: string): boolean {
  return (
    key.length > 0 &&
    !key.startsWith("/") &&
    !key.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  );
}

function objectPath(key: string): string {
  if (!isSafeObjectKey(key)) throw new Error(`Invalid storage key: ${key}`);
  return path.join(getStorageDir(), key);
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
  const filePath = objectPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

export async function getObject(key: string): Promise<Buffer> {
  try {
    return await readFile(objectPath(key));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Stored object not found: ${key}`);
    }
    throw error;
  }
}

export async function getObjectStream(key: string): Promise<ReadableStream | null> {
  const filePath = objectPath(key);
  const stream = createReadStream(filePath);
  return new Promise((resolve) => {
    stream.once("open", () => resolve(Readable.toWeb(stream) as unknown as ReadableStream));
    stream.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") resolve(null);
      else throw error;
    });
  });
}

// Idempotent like the old R2 delete: missing keys are a no-op.
export async function deleteObject(key: string): Promise<void> {
  await rm(objectPath(key), { force: true });
}

export async function removeImage(key: string): Promise<boolean> {
  await deleteObject(key);
  return true;
}

export function extractObjectKey(objectPath_: string): null | string {
  if (!objectPath_) return null;

  let pathname = objectPath_;
  try {
    pathname = new URL(objectPath_).pathname;
  } catch {
    // Relative app URL.
  }

  if (!pathname.startsWith(`${STORAGE_PREFIX}/`)) return null;
  const key = pathname.slice(STORAGE_PREFIX.length + 1);
  return isSafeObjectKey(key) ? key : null;
}
