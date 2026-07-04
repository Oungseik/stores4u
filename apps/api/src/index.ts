import { Effect } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { ApiLive } from "./app";

const parsePort = (value: string | undefined) => {
  const port = Number(value ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
};

const { dispose, handler } = HttpRouter.toWebHandler(ApiLive);
const server = Bun.serve({
  port: parsePort(Bun.env.PORT),
  fetch: (request) => handler(request),
});

Effect.runSync(Effect.logInfo(`api ready at ${server.url}`));

const shutdown = async () => {
  server.stop();
  await dispose();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
