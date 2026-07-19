import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { S3Client } from "bun";
import {
  STORAGE_ACCESS_KEY_ID,
  STORAGE_BUCKET_NAME,
  STORAGE_DRIVER,
  STORAGE_ENDPOINT,
  STORAGE_LOCAL_DIR,
  STORAGE_PUBLIC_URL,
  STORAGE_SECRET_ACCESS_KEY,
} from "$env/static/private";

/**
 * Storage driver: "local" writes to a directory served by /storage/[...key];
 * anything else (default) uses S3/R2 via Bun's S3Client.
 */
const isLocal = STORAGE_DRIVER === "local";

const s3 = isLocal
  ? null
  : new S3Client({
      accessKeyId: STORAGE_ACCESS_KEY_ID,
      secretAccessKey: STORAGE_SECRET_ACCESS_KEY,
      endpoint: STORAGE_ENDPOINT,
      bucket: STORAGE_BUCKET_NAME,
      sessionToken: "",
    });

function getS3(): S3Client {
  if (!s3) throw new Error("S3 client is unavailable in local storage mode");
  return s3;
}

// Local mode: files live under LOCAL_ROOT and are served at LOCAL_PREFIX/<key>.
// Exported so the public serve route validates against the exact same root.
export const LOCAL_PREFIX = "/storage";
export const LOCAL_ROOT = resolve(process.cwd(), STORAGE_LOCAL_DIR || "databases/storage");

const SAFE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export function storageContentType(key: string): string {
  return SAFE_CONTENT_TYPES[extname(key).toLowerCase()] ?? "application/octet-stream";
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

/** Resolve a key under root, or null if it escapes root. Pure + testable. */
export function safeJoinPath(root: string, key: string): string | null {
  const resolved = resolve(root, key);
  const rel = relative(root, resolved);
  if (rel === "" || rel.startsWith("..")) return null;
  return resolved;
}

/** Resolve a key to an absolute path, rejecting anything escaping LOCAL_ROOT. */
function localPath(key: string): string {
  const p = safeJoinPath(LOCAL_ROOT, key);
  if (!p) throw new Error(`Invalid storage key: ${key}`);
  return p;
}

export function getObjectUrl(key: string): string {
  if (isLocal) return `${LOCAL_PREFIX}/${key}`;
  return `${STORAGE_PUBLIC_URL}/${key}`;
}

export function presignDownload(key: string, _expiresIn = 900): string {
  // ponytail: local is served by a public route, no signing needed offline.
  if (isLocal) return `${LOCAL_PREFIX}/${key}`;
  return getS3().presign(key, { expiresIn: _expiresIn, method: "GET" });
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  if (isLocal) {
    const path = localPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return;
  }
  await getS3()
    .file(key)
    .write(data, { type: storageContentType(key) });
}

export async function getObject(key: string): Promise<Buffer> {
  if (isLocal) return Buffer.from(await readFile(localPath(key)));
  const file = getS3().file(key);
  return Buffer.from(await file.arrayBuffer());
}

export function getObjectStream(key: string): ReadableStream<Uint8Array> {
  if (isLocal) return Bun.file(localPath(key)).stream();
  return getS3().file(key).stream();
}

export async function deleteObject(key: string): Promise<void> {
  if (isLocal) {
    await unlink(localPath(key)).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== "ENOENT") throw e;
    });
    return;
  }
  await getS3().file(key).delete();
}

/** Remove by key (callers extract the key first). */
export async function removeImage(key: string): Promise<boolean> {
  await deleteObject(key);
  return true;
}

export function extractObjectKey(objectPath: string): string | null {
  if (!objectPath) return null;
  // Absolute URL form
  try {
    const url = new URL(objectPath);
    if (isLocal) {
      return url.pathname.startsWith(`${LOCAL_PREFIX}/`)
        ? url.pathname.slice(LOCAL_PREFIX.length + 1)
        : null;
    }
    return url.pathname.slice(1);
  } catch {
    // Relative form
    if (isLocal) {
      return objectPath.startsWith(`${LOCAL_PREFIX}/`)
        ? objectPath.slice(LOCAL_PREFIX.length + 1)
        : null;
    }
    return objectPath.startsWith(STORAGE_PUBLIC_URL)
      ? objectPath.slice(STORAGE_PUBLIC_URL.length + 1)
      : null;
  }
}
