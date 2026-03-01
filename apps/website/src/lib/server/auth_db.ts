import { connectDb } from "@repo/auth";
import { AUTH_DATABASE_URL, TURSO_GROUP_AUTH_TOKEN } from "$env/static/private";

export const db = connectDb(AUTH_DATABASE_URL, TURSO_GROUP_AUTH_TOKEN);
