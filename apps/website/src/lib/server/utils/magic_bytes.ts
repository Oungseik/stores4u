const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RIFF = Buffer.from("RIFF");
const WEBP = Buffer.from("WEBP");
const PDF = Buffer.from("%PDF-");

type DetectedImageType = "image/jpeg" | "image/png" | "image/webp";

function startsWith(buffer: Buffer, signature: Buffer, offset = 0): boolean {
  return buffer.subarray(offset, offset + signature.length).equals(signature);
}

function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (startsWith(buffer, JPEG)) return "image/jpeg";
  if (startsWith(buffer, PNG)) return "image/png";
  if (startsWith(buffer, RIFF) && startsWith(buffer, WEBP, 8)) return "image/webp";

  return null;
}

export function isAllowedImageType(buffer: Buffer): boolean {
  return detectImageType(buffer) !== null;
}

export function detectInvoiceFileType(buffer: Buffer): {
  mime: "image/jpeg" | "image/png" | "application/pdf";
  extension: "jpg" | "png" | "pdf";
} | null {
  const imageType = detectImageType(buffer);
  if (imageType === "image/jpeg") return { mime: imageType, extension: "jpg" };
  if (imageType === "image/png") return { mime: imageType, extension: "png" };
  if (startsWith(buffer, PDF)) return { mime: "application/pdf", extension: "pdf" };
  return null;
}
