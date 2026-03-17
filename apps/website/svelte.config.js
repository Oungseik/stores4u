import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";

const config = {
  preprocess: [vitePreprocess(), mdsvex()],
  extensions: [".svelte", ".svx"],
  kit: {
    adapter: adapter(),
    env: { dir: "../../" },
    alias: {
      "@lib": "../../packages/ui/src/lib",
      "@lib/*": "../../packages/ui/src/lib/*",
    },
    experimental: {
      tracing: { server: true },
      instrumentation: { server: true },
    },
  },
  compilerOptions: {},
  vitePlugin: { inspector: true },
};

export default config;
