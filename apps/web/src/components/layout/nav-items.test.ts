import { describe, expect, it } from "vitest";
import { isActive, NAV_ITEMS } from "./nav-items";

describe("isActive", () => {
  it("marca a rota e as sub-rotas", () => {
    expect(isActive("/ncm", "/ncm")).toBe(true);
    expect(isActive("/ncm/84271090", "/ncm")).toBe(true);
  });
  it("não confunde prefixos parciais", () => {
    expect(isActive("/ncmx", "/ncm")).toBe(false);
    expect(isActive("/dashboard", "/ncm")).toBe(false);
  });
});

describe("NAV_ITEMS", () => {
  it("contém o menu definido no escopo, mais o simulador, na ordem", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Dashboard",
      "Pesquisa NCM",
      "Simulador de tributos",
      "Inteligência de Importações",
      "Empresas",
      "Países",
      "Produtos",
      "Análises",
      "Favoritos",
      "Histórico",
      "Configurações",
    ]);
  });
});
