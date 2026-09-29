import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Inteligência de Importações" };

export default function ImportsPage() {
  return (
    <PlannedFeature
      title="Inteligência de Importações"
      description="Quantidade, valor e origem das importações por NCM, com base no Comex Stat (MDIC)."
      phase="Fase 3"
      items={[
        "Carga dos arquivos oficiais de importação por NCM (Comex Stat)",
        "Quantidade estatística, peso líquido, valor FOB, frete, seguro e CIF quando disponíveis",
        "Filtros por ano, mês, período, país, UF, via e unidade da Receita",
        "Gráficos por ano, por mês e por país",
      ]}
    />
  );
}
