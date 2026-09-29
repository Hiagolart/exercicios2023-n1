import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Favoritos" };

export default function FavoritesPage() {
  return (
    <PlannedFeature
      title="Meus favoritos"
      description="NCMs, produtos e países salvos para acesso rápido."
      phase="Fase 2"
      items={["Favoritar NCMs a partir da página de detalhes", "Favoritos de produtos e países"]}
    />
  );
}
