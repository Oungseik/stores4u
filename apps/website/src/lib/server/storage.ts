import { S3Client } from "bun";
import {
  STORAGE_ACCESS_KEY_ID,
  STORAGE_BUCKET_NAME,
  STORAGE_ENDPOINT,
  STORAGE_PUBLIC_URL,
  STORAGE_SECRET_ACCESS_KEY,
} from "$env/static/private";

const storage = new S3Client({
  accessKeyId: STORAGE_ACCESS_KEY_ID,
  secretAccessKey: STORAGE_SECRET_ACCESS_KEY,
  endpoint: STORAGE_ENDPOINT,
  bucket: STORAGE_BUCKET_NAME,
  sessionToken: "",
});

export function presignUpload(key: string, contentType: string, expiresIn = 900): string {
  return storage.presign(key, {
    expiresIn,
    method: "PUT",
    type: contentType,
  });
}

export async function getPartialObject(key: string, bytes: number): Promise<Buffer> {
  const file = storage.file(key);
  const stream = file.stream();
  const reader = stream.getReader();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (totalBytes < bytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalBytes += value.length;
  }

  reader.releaseLock();

  const buffer = Buffer.concat(chunks);
  return buffer.subarray(0, bytes);
}

export async function statObject(key: string): Promise<{ exists: boolean; size?: number }> {
  try {
    const file = storage.file(key);
    const exists = await file.exists();
    if (!exists) return { exists: false };

    const stat = await file.stat();
    return { exists: true, size: stat.size };
  } catch {
    return { exists: false };
  }
}

export function getObjectUrl(key: string): string {
  return `${STORAGE_PUBLIC_URL}/${key}`;
}

export async function removeImage(objectPath: string) {
  await storage.delete(objectPath, { bucket: STORAGE_BUCKET_NAME });
  return true;
}

export async function putObject(key: string, data: Buffer, contentType: string): Promise<void> {
  const file = storage.file(key);
  await file.write(data, { type: contentType });
}

export function extractObjectKey(objectPath: string): string | null {
  if (!objectPath) return null;
  try {
    const url = new URL(objectPath);
    return url.pathname.slice(1);
  } catch {
    return objectPath.startsWith(STORAGE_PUBLIC_URL)
      ? objectPath.slice(STORAGE_PUBLIC_URL.length + 1)
      : null;
  }
}
