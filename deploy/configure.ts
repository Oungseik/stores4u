import { randomBytes, X509Certificate } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");

function envValue(contents: string, key: string) {
  const raw = contents.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
  if (!raw) return "";
  try {
    return JSON.parse(raw) as string;
  } catch {
    return raw;
  }
}

function setEnv(contents: string, key: string, value: string) {
  const line = `${key}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(contents)
    ? contents.replace(pattern, line)
    : `${contents.trimEnd()}\n${line}\n`;
}

export function validateLanHost(value: string) {
  const host = value.trim().toLowerCase();
  const labels = host.split(".");
  const isIPv4 = labels.length === 4 && labels.every((label) => /^\d{1,3}$/.test(label));
  const validIPv4 = isIPv4 && labels.every((label) => Number(label) <= 255);
  const validHostname =
    host.length <= 253 &&
    labels.every(
      (label) =>
        label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    );
  if (!host || !(isIPv4 ? validIPv4 : validHostname)) {
    throw new Error("LAN host must be an IPv4 address or DNS hostname without a port.");
  }
  return host;
}

export async function configureDeployment(
  lanHost: string,
  root = repoRoot,
  templatePath = resolve(import.meta.dir, "bootstrap.html"),
) {
  const host = validateLanHost(lanHost);
  const envPath = resolve(root, ".env");
  const envExamplePath = resolve(root, "apps/website/.env.example");
  const generatedDir = resolve(root, "databases/deploy");
  const bootstrapDir = resolve(root, "databases/bootstrap");
  const origin = `https://${host}`;
  const certificateUrl = `http://${host}:8080/root.crt`;

  let envContents: string;
  try {
    envContents = await readFile(envPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    envContents = await readFile(envExamplePath, "utf8");
  }

  const secret = envValue(envContents, "BETTER_AUTH_SECRET") || randomBytes(32).toString("hex");
  const databasePath = resolve(
    root,
    envValue(envContents, "DATABASE_PATH") || "databases/store.db",
  );
  for (const [key, value] of Object.entries({
    DATABASE_PATH: databasePath,
    BETTER_AUTH_SECRET: secret,
    BETTER_AUTH_URL: origin,
    ORIGIN: origin,
    PUBLIC_ENVIRONMENT: "production",
    HOST: "127.0.0.1",
    PORT: "3000",
    BODY_SIZE_LIMIT: "12M",
    ADDRESS_HEADER: "X-Forwarded-For",
    XFF_DEPTH: "1",
  })) {
    envContents = setEnv(envContents, key, value);
  }

  await mkdir(dirname(envPath), { recursive: true });
  await mkdir(generatedDir, { recursive: true });
  await mkdir(bootstrapDir, { recursive: true });
  await writeFile(envPath, envContents, { mode: 0o600 });
  await chmod(envPath, 0o600);

  const caddyRoot = bootstrapDir.replaceAll("\\", "/").replaceAll('"', '\\"');
  await writeFile(
    resolve(generatedDir, "Caddyfile"),
    `https://${host} {\n\ttls internal\n\treverse_proxy 127.0.0.1:3000\n}\n\nhttp://${host}:8080 {\n\troot * "${caddyRoot}"\n\tfile_server\n}\n`,
  );

  const bootstrap = (await readFile(templatePath, "utf8"))
    .replaceAll("{{APP_URL}}", origin)
    .replaceAll("{{CERT_URL}}", certificateUrl)
    .replaceAll("{{LAN_HOST}}", host);
  await writeFile(resolve(bootstrapDir, "index.html"), bootstrap);

  return {
    host,
    origin,
    certificateUrl,
    envPath,
    caddyfile: resolve(generatedDir, "Caddyfile"),
    bootstrapDir,
  };
}

export async function certificateFingerprint(path: string) {
  return new X509Certificate(await readFile(path)).fingerprint256;
}

if (import.meta.main) {
  if (process.argv[2] === "--fingerprint") {
    if (!process.argv[3]) throw new Error("Certificate path is required.");
    console.log(await certificateFingerprint(process.argv[3]));
  } else {
    const host = process.argv[2];
    if (!host) {
      console.error("Usage: bun deploy/configure.ts <stable-lan-ip-or-hostname>");
      process.exit(1);
    }
    const result = await configureDeployment(host);
    console.log(`Configured ${result.origin}`);
  }
}
