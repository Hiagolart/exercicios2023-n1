import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "Empresas" };

const NOTE_URL =
  "https://balanca.economia.gov.br/balanca/metodologia/Nota-sobre-lista-de-exportadores-e-importadores.pdf";

export default function CompaniesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Empresas"
        description="Análise de importadores por produto, quando houver fonte legal e confiável."
      />
      <Section title="Por que não há dados de empresas">
        <div className="flex max-w-3xl flex-col gap-3 text-sm">
          <p>
            As fontes oficiais abertas não publicam quais empresas importaram cada NCM, nem
            quantidades ou valores por empresa. O Ministério do Desenvolvimento, Indústria, Comércio
            e Serviços (MDIC) descontinuou a lista de empresas exportadoras e importadoras para
            cumprir o sigilo fiscal previsto nos artigos 198 e 199 do Código Tributário Nacional.
          </p>
          <p>
            Por isso este módulo não exibe empresas. Ele está preparado para receber uma fonte
            licenciada no futuro, com avaliação jurídica e respeito à LGPD.
          </p>
          <p>
            <a
              href={NOTE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Nota informativa do MDIC sobre a lista de exportadores e importadores
            </a>
          </p>
        </div>
      </Section>
    </div>
  );
}
