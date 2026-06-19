import { db } from "$lib/server/db";
import { extractObjectKey, getObjectStream } from "$lib/server/storage";

export async function GET({
  params,
  locals,
}: {
  params: Promise<{ fileId: string }>;
  locals: App.Locals;
}) {
  if (!locals.session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { fileId } = await params;

  const shop = await db.query.shop.findFirst({
    where: { userId: locals.session.user.id },
  });

  if (!shop) {
    return new Response("Not Found", { status: 404 });
  }

  const file = await db.query.purchaseInvoiceFile.findFirst({
    where: { id: fileId },
  });

  if (!file) {
    return new Response("Not Found", { status: 404 });
  }

  const objectKey = extractObjectKey(file.objectPath);
  if (!objectKey) {
    return new Response("Invalid file path", { status: 500 });
  }

  const stream = getObjectStream(objectKey);

  return new Response(stream, {
    headers: {
      "Content-Type": file.fileType,
      "Content-Disposition": `inline; filename="${file.filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
