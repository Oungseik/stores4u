import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    name: "deploy",
    environment: "node",
    expect: { requireAssertions: true },
    include: ["**/*.{test,spec}.{js,ts}"],
  },
});
