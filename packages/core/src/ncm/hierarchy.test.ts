import { describe, expect, it } from "vitest";
import { resolveParents } from "./hierarchy";

describe("resolveParents", () => {
  it("usa o maior prefixo existente como pai", () => {
    const parents = resolveParents([
      "84",
      "8427",
      "84271",
      "842710",
      "84271011",
      "8427109",
      "84271090",
    ]);
    expect(parents.get("84")).toBeNull();
    expect(parents.get("8427")).toBe("84");
    expect(parents.get("84271")).toBe("8427");
    expect(parents.get("842710")).toBe("84271");
    expect(parents.get("84271011")).toBe("842710");
    expect(parents.get("8427109")).toBe("842710");
    expect(parents.get("84271090")).toBe("8427109");
  });

  it("pula níveis ausentes na fonte", () => {
    const parents = resolveParents(["01", "0101", "010121", "01012100"]);
    expect(parents.get("010121")).toBe("0101");
    expect(parents.get("01012100")).toBe("010121");
  });

  it("retorna null quando não há ancestral conhecido", () => {
    expect(resolveParents(["84271090"]).get("84271090")).toBeNull();
  });
});
