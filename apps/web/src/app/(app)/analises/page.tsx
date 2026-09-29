import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Análises" };

export default function AnalysesPage() {
  return (
    <PlannedFeature
      title="Análises"
      description="Comparações entre NCMs e entre períodos, valor médio e análises assistidas por IA."
      phase="Fases 4 e 5"
      items={[
        "Comparação de duas ou mais NCMs",
        "Comparação de períodos (ex.: 2024 × 2025, jan/2025 × jan/2026)",
        "Valor médio por unidade com metodologia explícita",
        "Análise automática e Assistente Comex baseados apenas nos dados da base",
      ]}
    />
  );
}
