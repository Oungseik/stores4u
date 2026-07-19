import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";

const config = {
  preprocess: [vitePreprocess(), mdsvex()],
  extensions: [".svelte", ".svx"],
  kit: {
    adapter: adapter({ config: "wrangler.jsonc", platformProxy: { environment: "dev" } }),
    env: { dir: "../../" },
    alias: {
      "@lib": "../../packages/ui/src/lib",
      "@lib/*": "../../packages/ui/src/lib/*",
    },
  },
  compilerOptions: {},
  vitePlugin: { inspector: true },
};

export default config;
