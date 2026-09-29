import { describe, expect, it } from "vitest";
import { ncmStatusOf } from "./status";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = d("2026-09-29");

describe("ncmStatusOf", () => {
  it("considera vigente sem data de término", () => {
    expect(ncmStatusOf({ dataInicio: d("2022-04-01"), dataFim: null }, today)).toBe("vigente");
    expect(ncmStatusOf({ dataInicio: null, dataFim: null }, today)).toBe("vigente");
  });
  it("identifica vigência encerrada e futura", () => {
    expect(ncmStatusOf({ dataInicio: d("2017-01-01"), dataFim: d("2021-12-31") }, today)).toBe(
      "encerrada",
    );
    expect(ncmStatusOf({ dataInicio: d("2027-01-01"), dataFim: null }, today)).toBe("futura");
  });
});
