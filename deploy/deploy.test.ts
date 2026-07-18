import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { backupDatabase, restoreDatabase } from "./backup-db";
import { configureDeployment, validateLanHost } from "./configure";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true })));
});

async function temporaryRoot() {
  const root = await mkdtemp(resolve(tmpdir(), "stores4u-deploy-"));
  temporaryRoots.push(root);
  await mkdir(resolve(root, "apps/website"), { recursive: true });
  await writeFile(
    resolve(root, "apps/website/.env.example"),
    'DATABASE_PATH="databases/store.db"\nBETTER_AUTH_SECRET=""\nPUBLIC_ENVIRONMENT="development"\n',
  );
  return root;
}

describe("deployment configuration", () => {
  test("writes a private HTTPS origin while preserving an existing secret", async () => {
    const root = await temporaryRoot();
    await writeFile(resolve(root, ".env"), 'BETTER_AUTH_SECRET="keep-me"\n');

    const result = await configureDeployment(
      "192.168.1.50",
      root,
      resolve(import.meta.dir, "bootstrap.html"),
    );
    const env = await readFile(resolve(root, ".env"), "utf8");
    const caddyfile = await readFile(result.caddyfile, "utf8");
    const bootstrap = await readFile(resolve(result.bootstrapDir, "index.html"), "utf8");

    expect(env).toContain('BETTER_AUTH_SECRET="keep-me"');
    expect(env).toContain(`DATABASE_PATH=${JSON.stringify(resolve(root, "databases/store.db"))}`);
    expect(env).toContain('BETTER_AUTH_URL="https://192.168.1.50"');
    expect(env).toContain('PUBLIC_ENVIRONMENT="production"');
    expect(caddyfile).toContain("tls internal");
    expect(caddyfile).toContain("http://192.168.1.50:8080");
    expect(bootstrap).toContain("https://192.168.1.50");
  });

  test("generates a secret when the template is empty", async () => {
    const root = await temporaryRoot();
    await configureDeployment("store.local", root, resolve(import.meta.dir, "bootstrap.html"));
    const env = await readFile(resolve(root, ".env"), "utf8");
    expect(env).toMatch(/^BETTER_AUTH_SECRET="[a-f0-9]{64}"$/m);
  });

  test("does not replace an unreadable environment path", async () => {
    const root = await temporaryRoot();
    await mkdir(resolve(root, ".env"));
    await expect(
      configureDeployment("store.local", root, resolve(import.meta.dir, "bootstrap.html")),
    ).rejects.toThrow();
  });

  test("rejects hosts containing ports or paths", () => {
    expect(() => validateLanHost("192.168.1.50:443")).toThrow();
    expect(() => validateLanHost("999.168.1.50")).toThrow();
    expect(() => validateLanHost("server/path")).toThrow();
  });
});

test("database backup checkpoints and copies the SQLite file", async () => {
  const root = await temporaryRoot();
  const databasePath = resolve(root, "databases/store.db");
  await mkdir(resolve(root, "databases"), { recursive: true });
  const database = new Database(databasePath);
  database.exec("CREATE TABLE check_value (value TEXT NOT NULL)");
  database.exec("INSERT INTO check_value VALUES ('ok')");
  database.close();

  const backupPath = await backupDatabase("databases/store.db", root);
  expect(backupPath).not.toBeNull();
  if (!backupPath) throw new Error("Backup was not created");
  const backup = new Database(backupPath);
  expect(backup.query("SELECT value FROM check_value").get()).toEqual({ value: "ok" });
  backup.close();

  await rm(databasePath);
  await restoreDatabase(backupPath, "databases/store.db", root);
  const restored = new Database(databasePath);
  expect(restored.query("SELECT value FROM check_value").get()).toEqual({ value: "ok" });
  restored.close();

  await restoreDatabase(null, "databases/store.db", root);
  expect(await Bun.file(databasePath).exists()).toBeFalse();
});
