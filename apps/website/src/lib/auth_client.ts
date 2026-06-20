import { adminClient, emailOTPClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  plugins: [adminClient(), emailOTPClient(), twoFactorClient()],
});
