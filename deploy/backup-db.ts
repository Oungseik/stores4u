import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { copyFile, mkdir, rename, rm } from "node:fs/promises";
import { basename, isAbsolute, resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");

export async function backupDatabase(
  configuredPath: string,
  root = repoRoot,
  backupDir = resolve(root, "databases/backups"),
) {
  const databasePath = isAbsolute(configuredPath) ? configuredPath : resolve(root, configuredPath);
  if (!existsSync(databasePath)) return null;

  const database = new Database(databasePath);
  database.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  database.close();

  await mkdir(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replaceAll(/[-:]/g, "").replace(".", "-");
  const backupPath = resolve(backupDir, `${basename(databasePath)}-${timestamp}`);
  await copyFile(databasePath, backupPath);
  return backupPath;
}

export async function restoreDatabase(
  backupPath: string | null,
  configuredPath: string,
  root = repoRoot,
) {
  const databasePath = isAbsolute(configuredPath) ? configuredPath : resolve(root, configuredPath);
  if (backupPath) {
    const restorePath = `${databasePath}.restore`;
    await copyFile(backupPath, restorePath);
    await rm(databasePath, { force: true });
    await rename(restorePath, databasePath);
  } else {
    await rm(databasePath, { force: true });
  }
  await rm(`${databasePath}-wal`, { force: true });
  await rm(`${databasePath}-shm`, { force: true });
}

if (import.meta.main) {
  const configuredPath = process.env.DATABASE_PATH || "databases/store.db";
  if (process.argv[2] === "--restore") {
    await restoreDatabase(
      process.argv[3] && process.argv[3] !== "-" ? process.argv[3] : null,
      configuredPath,
    );
  } else {
    const backup = await backupDatabase(configuredPath);
    if (backup) console.log(backup);
  }
}
