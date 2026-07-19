import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

/** Resolve relative database paths from the workspace root, regardless of package cwd. */
export function resolveDatabasePath(databasePath: string): string {
  if (isAbsolute(databasePath)) return databasePath;

  let root = resolve(process.cwd());
  while (!existsSync(join(root, "turbo.json"))) {
    const parent = dirname(root);
    if (parent === root) throw new Error("Could not find the repository root for DATABASE_PATH");
    root = parent;
  }

  return resolve(root, databasePath);
}
