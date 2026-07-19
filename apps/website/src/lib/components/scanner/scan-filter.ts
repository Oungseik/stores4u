export function createBarcodeScanFilter(gapMs = 500) {
  let lastBarcode: string | undefined;
  let lastSeenAt = 0;

  return (barcode: string, now = Date.now()) => {
    const accept = barcode !== lastBarcode || now - lastSeenAt >= gapMs;
    lastBarcode = barcode;
    lastSeenAt = now;
    return accept;
  };
}
