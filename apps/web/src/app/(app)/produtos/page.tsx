import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Produtos" };

export default function ProductsPage() {
  return (
    <PlannedFeature
      title="Produtos"
      description="Pesquise um produto pela descrição e veja as NCMs relacionadas e seus dados de importação."
      phase="Fase 7 (IA)"
      items={[
        "A busca por descrição já funciona na Pesquisa NCM",
        "Sinônimos revisados para termos comerciais",
        "Painel do produto com as NCMs relacionadas e seus dados de importação",
        "Sugestões por IA apresentadas como apoio à pesquisa, nunca como classificação fiscal",
      ]}
    />
  );
}
