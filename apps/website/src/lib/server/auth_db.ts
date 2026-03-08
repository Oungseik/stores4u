import { connectDb } from "@repo/auth";
import { AUTH_DATABASE_URL } from "$env/static/private";

export const db = connectDb(AUTH_DATABASE_URL);
