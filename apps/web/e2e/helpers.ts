import { expect, type Page } from "@playwright/test";
import { Client } from "pg";

/** Zera o controle de taxa (os testes criam mais contas por minuto que o limite de produção). */
export async function resetRateLimit(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('DELETE FROM "rate_limit"');
  } finally {
    await client.end();
  }
}

export async function signUp(page: Page, tag: string): Promise<void> {
  await resetRateLimit();
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Pessoa de Teste");
  await page.getByLabel("E-mail").fill(`e2e-${tag}-${Date.now()}@example.com`);
  await page.getByLabel("Senha").fill("senha-de-teste-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
