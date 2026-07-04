/**
 * Offline password reset for owner/admin accounts — the lockout escape hatch.
 *
 * Bypasses the session-gated /admin/set-user-password API. Use when an owner
 * or admin is locked out and nobody can sign in. Restricted to owner/admin
 * roles (refuses member/user). OAuth-only accounts have no password to reset.
 *
 * Usage (from apps/website):
 *   RESET_EMAIL='foo@bar.com' RESET_PASSWORD='newpass' bun run scripts/reset-password.ts
 *
 * Both email and password are read from the env so neither appears in argv /
 * shell history. Requires DATABASE_PATH (bun loads .env automatically).
 */
import { Database } from "bun:sqlite";
import { account, createDb, eq } from "@repo/database";
import { hashPassword } from "better-auth/crypto";

const MIN_PASSWORD_LENGTH = 8;

const dbPath = process.env.DATABASE_PATH;
if (!dbPath) {
  console.error("✗ DATABASE_PATH is not set (put it in .env or export it).");
  process.exit(1);
}

const email = process.env.RESET_EMAIL?.trim().toLowerCase();
if (!email) {
  console.error("✗ RESET_EMAIL is not set.");
  process.exit(1);
}

const newPassword = process.env.RESET_PASSWORD;
if (!newPassword) {
  console.error("✗ RESET_PASSWORD is not set.");
  process.exit(1);
}
if (newPassword.length < MIN_PASSWORD_LENGTH) {
  console.error(`✗ Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
const db = createDb(new Database(dbPath));

const target = await db.query.user.findFirst({
  where: { email },
  columns: { id: true, role: true, email: true },
});
if (!target) {
  console.error(`✗ No user found with email "${email}".`);
  process.exit(1);
}
if (target.role !== "owner" && target.role !== "admin") {
  console.error(`✗ Refusing: "${email}" has role "${target.role}". This tool is owner/admin only.`);
  process.exit(1);
}

const cred = await db.query.account.findFirst({
  where: { userId: target.id, providerId: "credential" },
});
if (!cred) {
  console.error(
    `✗ No credential (email/password) account for "${email}". OAuth-only accounts have no password to reset.`,
  );
  process.exit(1);
}

await db
  .update(account)
  .set({ password: await hashPassword(newPassword) })
  .where(eq(account.id, cred.id));
console.log(`✓ Password reset for ${target.email} (${target.role}).`);
process.exit(0);
