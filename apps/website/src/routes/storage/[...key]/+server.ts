import { getObjectStream, storageResponseHeaders } from "$lib/server/storage";

export async function GET({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const stream = await getObjectStream(key);
  if (!stream) return new Response("Not Found", { status: 404 });
  return new Response(stream, { headers: storageResponseHeaders(key) });
}
