import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Países" };

export default function CountriesPage() {
  return (
    <PlannedFeature
      title="Países"
      description="Origem das importações: participação, ranking e evolução por país."
      phase="Fase 6"
      items={[
        "Participação de cada país de origem por NCM e período",
        "Evolução da participação ao longo dos anos",
        "Filtro por país aplicado aos demais indicadores",
      ]}
    />
  );
}
