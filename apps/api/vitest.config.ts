import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Disable native node loaders and module runners that clash with Bun
    experimental: {
      viteModuleRunner: false,
      nodeLoader: false,
    },
    // Force Vitest to use process forks rather than worker_threads
    pool: "forks",
  },
});
