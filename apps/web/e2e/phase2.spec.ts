import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("pesquisa, favoritos e histórico", async ({ page }, testInfo) => {
  await signUp(page, `p2-${testInfo.project.name}`);

  // Pesquisa por descrição a partir da barra central do dashboard.
  await page.getByRole("searchbox").fill("equipamentos de movimentação");
  await page.getByRole("button", { name: "Pesquisar" }).click();
  await expect(page).toHaveURL(/\/ncm\?q=/);
  await expect(page.getByText(/resultado\(s\) para "equipamentos de movimentação"/)).toBeVisible();
  await expect(page.getByText("9901.10.10")).toBeVisible();

  // Pesquisa por código.
  await page.goto("/ncm?q=9901.10");
  await expect(page.getByText(/3 resultado\(s\)/)).toBeVisible();

  // Detalhe e favorito.
  await page.getByRole("link", { name: "Ver detalhes" }).nth(1).click();
  await expect(page).toHaveURL(/\/ncm\/99011010$/);
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await expect(page.getByRole("button", { name: "Remover dos favoritos" })).toBeVisible();

  await page.goto("/favoritos");
  await expect(page.getByRole("link", { name: /9901\.10\.10/ })).toBeVisible();

  // Histórico com as duas pesquisas, agrupadas em "Hoje".
  await page.goto("/historico");
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await expect(page.getByRole("link", { name: /equipamentos de movimentação/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /9901\.10/ })).toBeVisible();

  await page.getByRole("button", { name: "Limpar histórico" }).click();
  await expect(page.getByText("Nenhuma pesquisa registrada.")).toBeVisible();

  // API de pesquisa.
  const api = await page.request.get("/api/v1/ncm/search?q=movimentacao&limit=5");
  expect(api.status()).toBe(200);
  const body = await api.json();
  expect(body.data.estrategia).toBe("texto");
  expect(body.meta.metodologia).toContain("Busca textual");
  expect((await page.request.get("/api/v1/ncm/search?q=a")).status()).toBe(400);
});
