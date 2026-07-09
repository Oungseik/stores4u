import { stat } from "node:fs/promises";
import { LOCAL_ROOT, safeJoinPath } from "$lib/server/storage";

export async function GET({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const resolved = safeJoinPath(LOCAL_ROOT, key);
  if (!resolved) return new Response("Forbidden", { status: 403 });

  try {
    const s = await stat(resolved);
    if (!s.isFile()) return new Response("Not Found", { status: 404 });
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(Bun.file(resolved), {
    headers: { "Cache-Control": "private, max-age=3600" },
  });
}
