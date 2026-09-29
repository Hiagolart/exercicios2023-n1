import "server-only";
import { getPrisma } from "@comex/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

/**
 * Configuração de autenticação (Better Auth).
 * O segredo e a URL base vêm de BETTER_AUTH_SECRET e BETTER_AUTH_URL.
 */
export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      // Papel definido apenas pelo servidor; nunca aceito do cliente.
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
