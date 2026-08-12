export async function printReceipt(node: HTMLElement) {
  await document.fonts?.ready;
  await Promise.all(
    Array.from(node.querySelectorAll("img"), (image) => image.decode().catch(() => undefined)),
  );

  document.body.classList.add("printing-receipt");
  try {
    window.print();
  } finally {
    document.body.classList.remove("printing-receipt");
  }
}
