import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("rotas protegidas redirecionam para o login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("API exige autenticação", async ({ request }) => {
  const response = await request.get("/api/v1/ncm/tree");
  expect(response.status()).toBe(401);
});

test("cadastro, dashboard e navegação na estrutura NCM", async ({ page }, testInfo) => {
  await signUp(page, testInfo.project.name);
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Dados fictícios");
  await expect(page.getByText(/caráter informativo e de apoio à pesquisa/)).toBeVisible();

  await page.goto("/ncm");
  await page.getByRole("link", { name: /99\s*\[FICTÍCIO\] Capítulo/ }).click();
  await expect(page).toHaveURL(/\/ncm\/99$/);
  await page.getByRole("link", { name: /99\.01/ }).click();
  await page.getByRole("link", { name: /9901\.10/ }).click();
  await page.getByRole("link", { name: /9901\.10\.10/ }).click();
  await expect(page.getByText("Subitem").first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Estrutura" })).toContainText("9901.10");

  const api = await page.request.get("/api/v1/ncm/tree?parent=9901");
  expect(api.status()).toBe(200);
  const body = await api.json();
  expect(body.data.map((n: { codigo: string }) => n.codigo)).toEqual(["990110", "990190"]);
  expect(body.meta.fonte[0].isMock).toBe(true);

  const invalid = await page.request.get("/api/v1/ncm/tree?parent=abc1");
  expect(invalid.status()).toBe(400);
});
