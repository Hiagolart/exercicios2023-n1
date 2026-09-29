import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Histórico" };

export default function HistoryPage() {
  return (
    <PlannedFeature
      title="Histórico"
      description="Suas pesquisas recentes."
      phase="Fase 2"
      items={[
        "Registro automático das pesquisas por código, descrição e produto",
        "Agrupamento por dia",
      ]}
    />
  );
}
