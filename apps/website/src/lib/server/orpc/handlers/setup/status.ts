import { z } from "zod";
import { db } from "$lib/server/db";
import { os } from "$lib/server/orpc/base";

const input = z.object({});

/**
 * First-run status for /setup. Reachable pre-setup via the setupGate (it
 * allows /rpc/setup/* while no shop exists). Returns whether the owner
 * account still needs to be created.
 */
export const setupStatusHandler = os
  .route({ method: "GET" })
  .input(input)
  .handler(async () => {
    const firstUser = await db.query.user.findFirst({ columns: { id: true } });
    return { needsAccount: !firstUser };
  });
