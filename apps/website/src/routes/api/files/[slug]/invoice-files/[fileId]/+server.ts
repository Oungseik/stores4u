import { db as authDb } from "$lib/server/db";
import { getShopDb } from "$lib/server/shop_db";
import { extractObjectKey, getObjectStream } from "$lib/server/storage";

export async function GET({
  params,
  locals,
}: {
  params: Promise<{ slug: string; fileId: string }>;
  locals: App.Locals;
}) {
  if (!locals.session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug, fileId } = await params;

  const shop = await authDb.query.shop.findFirst({
    where: { slug },
  });

  if (!shop || shop.userId !== locals.session.user.id) {
    return new Response("Not Found", { status: 404 });
  }

  const shopDb = getShopDb({ slug: shop.slug });
  const file = await shopDb.query.purchaseInvoiceFile.findFirst({
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
