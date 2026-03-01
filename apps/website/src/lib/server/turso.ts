import { createClient } from "@tursodatabase/api";
import { TURSO_GROUP_AUTH_TOKEN, TURSO_ORGANIZATION } from "$env/static/private";

export const turso = createClient({ org: TURSO_ORGANIZATION, token: TURSO_GROUP_AUTH_TOKEN });
