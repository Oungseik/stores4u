import { isDashboardRole } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { extractObjectKey, getObjectStream, storageResponseHeaders } from "$lib/server/storage";

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
  if (!isDashboardRole(locals.session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { fileId } = await params;

  const shop = await db.query.shop.findFirst();

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

  const stream = await getObjectStream(objectKey);
  if (!stream) return new Response("Not Found", { status: 404 });

  return new Response(stream, { headers: storageResponseHeaders(objectKey) });
}
