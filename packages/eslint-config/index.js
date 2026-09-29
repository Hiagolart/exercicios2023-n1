import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** Configuração ESLint compartilhada para pacotes TypeScript (sem React). */
export const base = tseslint.config(
  { ignores: ["dist/**", "coverage/**", "src/generated/**", ".next/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
