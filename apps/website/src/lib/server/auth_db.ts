import { connectRemote } from "@repo/website-auth";
import { AUTH_DATABASE_URL, TURSO_GROUP_AUTH_TOKEN } from "$env/static/private";

export const db = connectRemote(AUTH_DATABASE_URL, TURSO_GROUP_AUTH_TOKEN);
