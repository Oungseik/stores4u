import { createClient } from "@libsql/client";
import { readFile, unlink } from "node:fs/promises";
import { migrate } from "drizzle-orm/libsql/migrator";
import { expect, test, vi } from "vitest";

vi.mock("zod", async (importOriginal) => {
  const z = await importOriginal<typeof import("zod")>();
  return { ...z, z };
});

test("createDb executes through a libSQL client", async () => {
  const { createDb, sql } = await import("./index");
  const client = createClient({ url: "file::memory:" });
  const db = createDb(client);

  const result = await db.run(sql`select 1 as ok`);

  expect(result.rows[0]).toEqual({ ok: 1 });
  client.close();
});

test("invoice settings migration keeps hidden addresses hidden", async () => {
  const url = `file:/tmp/stores4u-migration-${crypto.randomUUID()}.db`;
  const client = createClient({ url });
  const migrations = new URL("../drizzle/", import.meta.url);

  try {
    await client.executeMultiple(
      await readFile(new URL("20260719063208_dark_omega_red/migration.sql", migrations), "utf8"),
    );
    await client.execute(
      "INSERT INTO invoice_settings (id, show_address, created_at, updated_at) VALUES ('default', false, 0, 0)",
    );
    await client.executeMultiple(
      await readFile(
        new URL("20260719142312_friendly_baron_strucker/migration.sql", migrations),
        "utf8",
      ),
    );

    const result = await client.execute(
      "SELECT show_state, show_country FROM invoice_settings WHERE id = 'default'",
    );
    expect(result.rows[0]).toMatchObject({ show_state: 0, show_country: 0 });
  } finally {
    client.close();
    await unlink(new URL(url)).catch(() => undefined);
  }
});

test("initial migration enforces unique session tokens and product SKUs", async () => {
  const url = `file:/tmp/stores4u-migration-${crypto.randomUUID()}.db`;
  const client = createClient({ url });
  const { createDb } = await import("./index");

  try {
    await migrate(createDb(client), {
      migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
    });
    await client.executeMultiple(`
      INSERT INTO user (id, name, email, email_verified, language, role, banned, created_at, updated_at)
      VALUES ('user-1', 'Owner', 'owner@example.com', 1, 'en', 'owner', 0, 0, 0);
      INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id)
      VALUES ('session-1', 1, 'token-1', 0, 0, 'user-1');
      INSERT INTO product (id, sku, name, uom, price_cents, created_at, updated_at)
      VALUES ('product-1', 'sku-1', 'Product', 'each', 100, 0, 0);
    `);

    await expect(
      client.execute(
        "INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES ('session-2', 1, 'token-1', 0, 0, 'user-1')",
      ),
    ).rejects.toThrow();
    await expect(
      client.execute(
        "INSERT INTO product (id, sku, name, uom, price_cents, created_at, updated_at) VALUES ('product-2', 'sku-1', 'Product', 'each', 100, 0, 0)",
      ),
    ).rejects.toThrow();
  } finally {
    client.close();
    await unlink(new URL(url)).catch(() => undefined);
  }
});
