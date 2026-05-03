import { createClient } from "@tursodatabase/api";
import { TURSO_API_TOKEN, TURSO_ORGANIZATION } from "$env/static/private";


export const turso = createClient({ org: TURSO_ORGANIZATION, token: TURSO_API_TOKEN });
