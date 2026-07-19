import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { resolveDatabasePath } from "./database-path";
import { createDb } from "./index";

test("Drizzle migration and website runtime open the same relative database path", () => {
  const originalCwd = process.cwd();
  const repositoryRoot = resolve(import.meta.dir, "../../..");
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "stores4u-data-01-"));
  const configuredPath = relative(repositoryRoot, join(temporaryDirectory, "store.db"));

  try {
    process.chdir(join(repositoryRoot, "packages/database"));
    const migrationPath = resolveDatabasePath(configuredPath);
    const migrationClient = new Database(migrationPath);
    migrate(createDb(migrationClient), {
      migrationsFolder: join(repositoryRoot, "packages/database/drizzle"),
    });
    migrationClient.close();

    process.chdir(join(repositoryRoot, "apps/website"));
    const runtimePath = resolveDatabasePath(configuredPath);
    const runtimeClient = new Database(runtimePath);
    const migratedTable = runtimeClient
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'shop'",
      )
      .get();
    runtimeClient.close();

    expect(runtimePath).toBe(migrationPath);
    expect(migratedTable).toEqual({ name: "shop" });
  } finally {
    process.chdir(originalCwd);
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
