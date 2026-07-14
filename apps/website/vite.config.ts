import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: "../..",
  plugins: [
    tailwindcss(),
    sveltekit(),
    devtoolsJson(),
    paraglideVitePlugin({ project: "./project.inlang", outdir: "./src/lib/paraglide" }),
  ],
  ssr: {
    external: ["sharp", "bun"],
  },
  server: {
    allowedHosts: ["local.stores4u.app"],
    fs: {
      allow: ["../../"], // point this to the root of the monorepo
    },
  },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
