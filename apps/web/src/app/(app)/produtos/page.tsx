import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Produtos" };

export default function ProductsPage() {
  return (
    <PlannedFeature
      title="Produtos"
      description="Pesquise um produto pela descrição e veja as NCMs relacionadas e seus dados de importação."
      phase="Fase 2 (busca) e Fase 5 (sugestões por IA)"
      items={[
        "Busca por descrição na nomenclatura oficial",
        "Sinônimos revisados para termos comerciais",
        "Sugestões por IA apresentadas como apoio à pesquisa, nunca como classificação fiscal",
      ]}
    />
  );
}
