import { InferServerPlugin, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import type { auth } from "$lib/server/auth";

export const authClient = createAuthClient({
  plugins: [InferServerPlugin<typeof auth, "organization">(), organizationClient()],
});
