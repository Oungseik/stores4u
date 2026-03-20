const IMAGE_SIGNATURES: Array<{ bytes: number[]; mask?: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mime: "image/png" },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" },
  { bytes: [0x3c, 0x73, 0x76, 0x67], mime: "image/svg+xml" },
  { bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c], mime: "image/svg+xml" },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export function detectImageType(buffer: Buffer): string | null {
  for (const sig of IMAGE_SIGNATURES) {
    if (buffer.length < sig.bytes.length) continue;

    let matches = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      const bufByte = buffer[i];
      const sigByte = sig.bytes[i];
      const mask = sig.mask?.[i];

      if (mask !== undefined) {
        if ((bufByte & mask) !== (sigByte & mask)) {
          matches = false;
          break;
        }
      } else if (bufByte !== sigByte) {
        matches = false;
        break;
      }
    }

    if (matches) return sig.mime;
  }

  return null;
}

export function isAllowedImageType(buffer: Buffer): boolean {
  const detected = detectImageType(buffer);
  return detected !== null && ALLOWED_IMAGE_TYPES.includes(detected);
}

export { ALLOWED_IMAGE_TYPES };
