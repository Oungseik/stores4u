import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { DATABASE_PATH } from "$env/static/private";

/** Single store memory — one store per server. */
let memory: Memory | null = null;

export function getStoreMemory(): Memory {
  if (memory) return memory;

  memory = new Memory({
    storage: new LibSQLStore({
      id: "store-memory",
      url: `file:${DATABASE_PATH}`,
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

  return memory;
}
