import { ArrowRight } from "lucide-react";
import { FiscalDisclaimer } from "@/components/data/disclaimer";
import { Brand } from "@/components/layout/brand";
import { ButtonLink } from "@/components/ui/button";

// Estrutura de um código NCM (exemplo ilustrativo: apenas os níveis, sem descrição).
const CODE_ANATOMY = [
  { digits: "84", level: "Capítulo" },
  { digits: "27", level: "Posição" },
  { digits: "10", level: "Subposição" },
  { digits: "9", level: "Item" },
  { digits: "0", level: "Subitem" },
];

// Métricas por NCM e o campo correspondente na base oficial do Comex Stat.
const METRICS = [
  { name: "Quantidade importada", field: "QT_ESTAT", note: "Na unidade estatística da NCM" },
  { name: "Peso líquido", field: "KG_LIQUIDO", note: "Quilogramas" },
  { name: "Valor FOB", field: "VL_FOB", note: "US$ correntes" },
  { name: "Frete e seguro", field: "VL_FRETE · VL_SEGURO", note: "Quando informados pela fonte" },
  { name: "País de origem", field: "CO_PAIS", note: "Participação e evolução" },
  {
    name: "UF, via e unidade da Receita",
    field: "SG_UF_NCM · CO_VIA · CO_URF",
    note: "Recortes regionais e logísticos",
  },
];

const ANALYSES = [
  {
    title: "Evolução das importações",
    text: "Quantidade e valor por ano e por mês, com comparação entre períodos.",
  },
  {
    title: "Origem das importações",
    text: "Participação de cada país de origem e como ela muda ao longo do tempo.",
  },
  {
    title: "Valor médio por unidade",
    text: "Calculado só quando a unidade estatística permite, com a metodologia sempre visível.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <Brand />
          <nav className="flex items-center gap-2">
            <ButtonLink href="/entrar" variant="ghost">
              Entrar
            </ButtonLink>
            <ButtonLink href="/cadastro" variant="secondary">
              Criar conta
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-4 py-16 sm:px-8">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Pesquisa fiscal e inteligência de importações em um só lugar.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Consulte NCMs, analise dados de importação e transforme informações de comércio
              exterior em insights.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/ncm">
                Pesquisar NCM <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
              <ButtonLink href="/importacoes" variant="secondary">
                Explorar dados
              </ButtonLink>
            </div>
          </div>

          <figure className="rounded-lg border border-line bg-surface p-6">
            <figcaption className="text-xs font-medium uppercase tracking-wider text-muted">
              Como se lê um código NCM
            </figcaption>
            <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-4 font-mono text-3xl tabular-nums sm:text-4xl">
              {CODE_ANATOMY.map((part, i) => (
                <div key={part.level} className="flex items-end gap-1">
                  {i === 2 || i === 3 ? <span className="pb-6 text-muted">.</span> : null}
                  <div className="flex flex-col items-center gap-2">
                    <span className={i === 0 ? "text-accent" : undefined}>{part.digits}</span>
                    <span className="font-sans text-[11px] uppercase tracking-wider text-muted">
                      {part.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted">
              Oito dígitos: os seis primeiros seguem o Sistema Harmonizado; os dois últimos são
              desdobramentos do Mercosul.
            </p>
          </figure>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold tracking-tight">Exemplos de análises</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {ANALYSES.map((a) => (
              <div key={a.title} className="flex flex-col gap-2 border-t-2 border-accent pt-4">
                <h3 className="font-medium">{a.title}</h3>
                <p className="text-sm text-muted">{a.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold tracking-tight">
              Dados oficiais, com a origem à vista
            </h2>
            <p className="mt-2 text-sm text-muted">
              A nomenclatura vem da Receita Federal e as estatísticas de importação vêm do Comex
              Stat (MDIC). Cada tela informa fonte, período, data de atualização e metodologia.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Métrica</th>
                  <th className="px-4 py-3 font-medium">Campo na fonte</th>
                  <th className="px-4 py-3 font-medium">Observação</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.name} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{m.field}</td>
                    <td className="px-4 py-3 text-muted">{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">
            Dados de empresas importadoras por produto não são publicados pelas fontes oficiais, por
            sigilo fiscal.{" "}
            <a
              href="https://balanca.economia.gov.br/balanca/metodologia/Nota-sobre-lista-de-exportadores-e-importadores.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Nota do MDIC
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <FiscalDisclaimer />
        </div>
      </footer>
    </div>
  );
}
