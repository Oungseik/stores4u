import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { LRUCache } from "lru-cache";
import { TURSO_GROUP, TURSO_GROUP_AUTH_TOKEN, TURSO_ORGANIZATION } from "$env/static/private";

function getShopDbUrl(slug: string): string {
  return `libsql://${TURSO_GROUP}-${slug}-${TURSO_ORGANIZATION}.turso.io`;
}

const memoryCache = new LRUCache<string, Memory>({
  max: 500,
  ttl: 30 * 60 * 1000,
  ttlAutopurge: true,
});

export function createShopMemory(slug: string): Memory {
  const cached = memoryCache.get(slug);
  if (cached) return cached;

  const memory = new Memory({
    storage: new LibSQLStore({
      id: `shop-memory-${slug}`,
      url: getShopDbUrl(slug),
      authToken: TURSO_GROUP_AUTH_TOKEN,
    }),
    options: {
      lastMessages: 20,
      generateTitle: true,
      observationalMemory: {
        model: "openrouter/deepseek/deepseek-v3.2",
        scope: "thread",
        observation: {
          threadTitle: true,
          instruction:
            "Prioritize capturing supplier names, invoice details, product names/quantities/prices, shop preferences, and business operations. Ignore general chit-chat.",
        },
        reflection: {
          instruction:
            "Consolidate related shop operations together. Preserve specific supplier details, pricing, dates, and invoice numbers.",
        },
      },
    },
  });

  memoryCache.set(slug, memory);
  return memory;
}
