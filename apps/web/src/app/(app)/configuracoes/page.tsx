import type { Metadata } from "next";
import { PlannedFeature } from "@/components/ui/planned-feature";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <PlannedFeature
      title="Configurações"
      description="Conta, preferências e administração das cargas de dados."
      phase="Fase 3 (cargas) e Fase 9 (preferências)"
      items={[
        "Relatórios das cargas de dados (somente administradores)",
        "Envio de arquivos CSV/JSON para importação",
        "Preferências de exibição",
      ]}
    />
  );
}
