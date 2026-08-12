import { toBlob } from "html-to-image";

export async function saveOrShareReceiptImage(node: HTMLElement, filename: string) {
  await document.fonts?.ready;
  // ponytail: one 3× canvas; paginate only if very large orders hit browser canvas limits.
  const blob = await toBlob(node, { backgroundColor: "#fff", pixelRatio: 3 });
  if (!blob) throw new Error("Receipt image generation failed");

  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
