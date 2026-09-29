import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaxSimulator, type RateField, type RatePreset } from "./simulator";

const presets = Object.fromEntries(
  (["II", "IPI", "PIS", "COFINS", "ICMS"] as RateField[]).map((k) => [
    k,
    { valor: "", origem: "teste" },
  ]),
) as Record<RateField, RatePreset>;

function fill(id: string, value: string) {
  const input = document.getElementById(id);
  if (!input) throw new Error(`Campo ${id} não encontrado`);
  fireEvent.change(input, { target: { value } });
}

describe("TaxSimulator", () => {
  it("lista o que falta preencher e calcula quando os dados estão completos", () => {
    render(<TaxSimulator presets={presets} />);
    expect(screen.getByText("Taxa de câmbio deve ser maior que zero.")).toBeTruthy();

    fill("cambio", "5,5");
    fill("despesas", "154,23");
    fill("aliquota-II", "14");
    fill("aliquota-IPI", "10");
    fill("aliquota-PIS", "2,1");
    fill("aliquota-COFINS", "9,65");
    fill("aliquota-ICMS", "18");

    const table = screen.getByRole("table");
    const custo = within(table)
      .getByText(/Custo total estimado/)
      .closest("tr");
    expect(custo?.textContent?.replace(/\s/g, " ")).toContain("R$ 102.297,94");
    expect(within(table).getByText("Imposto de Importação").closest("tr")?.textContent).toContain(
      "8.547,00",
    );
  });

  it("aceita NT no IPI", () => {
    render(<TaxSimulator presets={{ ...presets, IPI: { valor: "NT", origem: "teste" } }} />);
    fill("cambio", "5");
    for (const id of ["aliquota-II", "aliquota-PIS", "aliquota-COFINS", "aliquota-ICMS"])
      fill(id, "0");
    expect(screen.getByRole("table").textContent).toContain("NT");
  });
});
