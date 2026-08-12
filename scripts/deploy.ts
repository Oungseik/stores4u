import { existsSync } from "node:fs";

const root = `${import.meta.dir}/..`;
const envFile = `${root}/.env.prod`;

if (!existsSync(envFile)) {
  console.error("Missing .env.prod; copy .env.example and add production credentials.");
  process.exit(1);
}

const envText = await Bun.file(envFile).text();
const productionKeys = new Set([
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "PUBLIC_ENVIRONMENT",
  "PUBLIC_SITE_NAME",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "MISTRAL_API_KEY",
]);
for (const match of envText.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)) {
  productionKeys.add(match[1]);
}
const env = { ...process.env };
for (const key of productionKeys) delete env[key];

async function run(command: string[], cwd = root) {
  const child = Bun.spawn(command, {
    cwd,
    env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) process.exit(exitCode);
}

await run([
  "bun",
  `--env-file=${envFile}`,
  "-e",
  `
const required = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(\`.env.prod is missing: \${missing.join(", ")}\`);
if (!process.env.BETTER_AUTH_URL.startsWith("https://")) throw new Error("BETTER_AUTH_URL must be an HTTPS production URL");
if (process.env.PUBLIC_ENVIRONMENT !== "production") throw new Error("PUBLIC_ENVIRONMENT must be production");
`,
]);
if (process.argv.includes("--check")) process.exit(0);

await run(["bun", `--env-file=${envFile}`, "run", "build"]);
await run(["bun", `--env-file=${envFile}`, "turbo", "db:migrate"]);
await run(["wrangler", "deploy", "--secrets-file", envFile], `${root}/apps/website`);
