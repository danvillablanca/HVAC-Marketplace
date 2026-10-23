import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// .env vive en la raiz del monorepo; Next solo lee los de backend/.
// loadEnvFile no pisa variables ya definidas, asi que .env.local gana sobre .env.
for (const file of [".env.local", ".env"]) {
  const envPath = fileURLToPath(new URL(`../${file}`, import.meta.url));
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

const nextConfig: NextConfig = {
  transpilePackages: ["@hvac/shared"],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
