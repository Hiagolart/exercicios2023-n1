import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

// Depende das cargas fictícias: `pnpm ingest ncm --source mock` e `pnpm ingest tributos --source mock`,
// e da regra geral: `pnpm ingest tributos --source legislacao`.
test("tributos da NCM, histórico e simulador", async ({ page }, testInfo) => {
  await signUp(page, `p3-${testInfo.project.name}`);

  await page.goto("/ncm/99011010");
  const panel = page.locator("section", {
    has: page.getByRole("heading", { name: "Tributos na importação" }),
  });
  await expect(panel.getByRole("status")).toContainText("inventadas");
  const ii = panel.getByRole("row", { name: /^Imposto de Importação/ });
  await expect(ii).toContainText("2%");
  await expect(ii).toContainText("Alíquota da NCM: 14%");
  await expect(ii).toContainText("Exceção: [FICTÍCIO] LETEC");
  await expect(panel.getByRole("row", { name: /^Cofins-Importação/ })).toContainText("9,65%");
  await expect(panel.getByRole("row", { name: /^Cofins-Importação/ })).toContainText("Regra geral");

  await page.getByRole("link", { name: "Histórico de alíquotas" }).click();
  await expect(page.getByRole("heading", { name: "Histórico de alíquotas" })).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Lei 10.865/2004");

  await page.goto("/ncm/99011010");
  await page.getByRole("link", { name: "Simular tributos" }).click();
  await expect(page).toHaveURL(/\/simulador\?ncm=99011010$/);
  await expect(page.locator("#aliquota-II")).toHaveValue("2");
  await expect(page.locator("#aliquota-IPI")).toHaveValue("5");

  // VA = 11.100 × 5 = 55.500; II 2% = 1.110; IPI 5% × 56.610 = 2.830,50; PIS 1.165,50; Cofins 5.355,75;
  // base do ICMS = 65.961,75 ÷ 0,82 = 80.441,16 = custo total.
  await page.locator("#cambio").fill("5");
  await page.locator("#aliquota-ICMS").fill("18");
  const custo = page.getByRole("row", { name: /Custo total estimado/ });
  await expect(custo).toContainText("80.441,16");

  const api = await page.request.get("/api/v1/ncm/99011010/tributos");
  expect(api.status()).toBe(200);
  const body = await api.json();
  expect(body.data.destaques).toEqual([]);
  expect((await page.request.get("/api/v1/ncm/9901/tributos")).status()).toBe(400);
});
