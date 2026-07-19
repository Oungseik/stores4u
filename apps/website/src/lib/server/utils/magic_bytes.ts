const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RIFF = Buffer.from("RIFF");
const WEBP = Buffer.from("WEBP");
const PDF = Buffer.from("%PDF-");

function startsWith(buffer: Buffer, signature: Buffer, offset = 0): boolean {
  return buffer.subarray(offset, offset + signature.length).equals(signature);
}

export function detectImageFileType(buffer: Buffer): {
  mime: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
} | null {
  if (startsWith(buffer, JPEG)) return { mime: "image/jpeg", extension: "jpg" };
  if (startsWith(buffer, PNG)) return { mime: "image/png", extension: "png" };
  if (startsWith(buffer, RIFF) && startsWith(buffer, WEBP, 8)) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

export function isAllowedImageType(buffer: Buffer): boolean {
  return detectImageFileType(buffer) !== null;
}

export function detectInvoiceFileType(buffer: Buffer): {
  mime: "image/jpeg" | "image/png" | "application/pdf";
  extension: "jpg" | "png" | "pdf";
} | null {
  const imageType = detectImageFileType(buffer);
  if (imageType?.mime === "image/jpeg") return { mime: "image/jpeg", extension: "jpg" };
  if (imageType?.mime === "image/png") return { mime: "image/png", extension: "png" };
  if (startsWith(buffer, PDF)) return { mime: "application/pdf", extension: "pdf" };
  return null;
}
