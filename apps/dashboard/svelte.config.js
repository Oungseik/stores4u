import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "svelte-adapter-bun";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  compilerOptions: {
    runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
  },
  kit: {
    adapter: adapter(),
    env: { dir: "../../" },
    alias: {
      "@lib": "../../packages/ui/src/lib",
      "@lib/*": "../../packages/ui/src/lib/*",
    },
    typescript: {
      config: (config) => ({
        ...config,
        include: [...config.include, "../drizzle.config.ts"],
      }),
    },
  },
  vitePlugin: { inspector: true },
};

export default config;
