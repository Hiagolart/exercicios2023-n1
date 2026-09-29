import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";

// Variáveis de ambiente ficam no .env da raiz do monorepo.
// Os comandos do Next rodam a partir de apps/web.
loadEnvConfig(
  path.resolve(process.cwd(), "../.."),
  process.env.NODE_ENV !== "production",
  console,
  true,
);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Pacotes internos do monorepo são publicados como TypeScript.
  transpilePackages: ["@comex/core", "@comex/db"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
