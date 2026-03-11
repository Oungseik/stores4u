import { connectDbRemote } from "@repo/auth";
import { AUTH_DATABASE_URL, TURSO_GROUP_AUTH_TOKEN } from "$env/static/private";

export const db = connectDbRemote(AUTH_DATABASE_URL, TURSO_GROUP_AUTH_TOKEN);
