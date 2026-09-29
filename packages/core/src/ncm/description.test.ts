import { describe, expect, it } from "vitest";
import { cleanNcmDescription } from "./description";

describe("cleanNcmDescription", () => {
  it("remove marcadores de recuo e espaços extras", () => {
    expect(cleanNcmDescription("-- Texto   de  teste")).toBe("Texto de teste");
    expect(cleanNcmDescription("--- Outros")).toBe("Outros");
    expect(cleanNcmDescription("Texto sem recuo")).toBe("Texto sem recuo");
  });
  it("preserva hífens internos", () => {
    expect(cleanNcmDescription("- Auto-propelidos")).toBe("Auto-propelidos");
  });
});
