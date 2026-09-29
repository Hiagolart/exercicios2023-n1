import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryList } from "./history-list";

describe("HistoryList", () => {
  it("agrupa por dia e liga cada termo à pesquisa", () => {
    const now = new Date("2026-09-29T18:00:00Z");
    render(
      <HistoryList
        now={now}
        items={[
          {
            id: "1",
            termo: "8427.10.90",
            tipo: "codigo",
            createdAt: new Date("2026-09-29T17:32:00Z"),
          },
          {
            id: "2",
            termo: "Paleteira elétrica",
            tipo: "descricao",
            createdAt: new Date("2026-09-29T17:28:00Z"),
          },
          {
            id: "3",
            termo: "8427.20.90",
            tipo: "codigo",
            createdAt: new Date("2026-09-28T13:00:00Z"),
          },
        ]}
      />,
    );
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual(["Hoje", "Ontem"]);
    expect(screen.getByRole("link", { name: /Paleteira elétrica/ }).getAttribute("href")).toBe(
      "/ncm?q=Paleteira%20el%C3%A9trica",
    );
    expect(screen.getByText("14:32")).toBeTruthy();
  });
});
