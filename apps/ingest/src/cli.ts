import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { parseSourceDate, type SourceMetadata } from "@comex/core";
import { createPrismaClient } from "@comex/db";
import { runNcmIngestion } from "./pipeline/ncm";
import { runTaxIngestion } from "./pipeline/tax";
import { ClassifNcmProvider } from "./providers/classif";
import { MockNcmProvider } from "./providers/mock";
import { OfficialTableProvider } from "./providers/official-xlsx";
import { fileReader, httpReader } from "./providers/readers";
import { MockTaxProvider } from "./providers/tax-mock";
import { TaxTemplateProvider } from "./providers/tax-template";
import { formatReport } from "./report";

const USAGE = `Uso:
  Nomenclatura (NCM)
    pnpm ingest ncm --source classif              Baixa a NCM vigente da Receita Federal
    pnpm ingest ncm --source file --file <json>    Importa o JSON da NCM baixado manualmente
    pnpm ingest ncm --source mock                  Dados FICTÍCIOS (somente desenvolvimento)

  Tributos
    pnpm ingest tributos --source tipi --file <xlsx> [--ato "<ato legal>"] [--referencia aaaa-mm-dd]
    pnpm ingest tributos --source tec  --file <xlsx> [--ato "<ato legal>"] [--referencia aaaa-mm-dd]
    pnpm ingest tributos --source legislacao        Regras gerais (data/legislacao/regras-gerais.csv)
    pnpm ingest tributos --source arquivo --file <csv|json> --fonte "<nome da fonte>" [--fonte-url <url>]
    pnpm ingest tributos --source mock              Dados FICTÍCIOS (somente desenvolvimento)`;

const DEFAULT_CLASSIF_URL =
  "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO";

const LEGISLACAO_SOURCE: SourceMetadata = {
  id: "legislacao-regras-gerais",
  nome: "Legislação federal — regras gerais (transcrição manual)",
  url: null,
  licenca: null,
  descricao:
    "Alíquotas gerais transcritas da legislação citada em cada registro. Conferir antes de usar.",
  isMock: false,
};

type Options = {
  source?: string;
  file?: string;
  ato?: string;
  referencia?: string;
  fonte?: string;
  "fonte-url"?: string;
};

const sha256 = async (path: string) =>
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex");

function requireFile(file: string | undefined): string {
  if (!file) throw new Error("Informe --file <caminho>.");
  return file;
}

function refuseMockInProduction(): void {
  if (process.env.NODE_ENV === "production")
    throw new Error("Dados fictícios não podem ser carregados em produção.");
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function ingestNcm(opts: Options) {
  switch (opts.source) {
    case "classif":
      return {
        provider: new ClassifNcmProvider(
          httpReader(process.env.CLASSIF_NCM_URL ?? DEFAULT_CLASSIF_URL),
        ),
      };
    case "file": {
      const file = requireFile(opts.file);
      return { provider: new ClassifNcmProvider(fileReader(file)), fileHash: await sha256(file) };
    }
    case "mock":
      refuseMockInProduction();
      return { provider: new MockNcmProvider() };
    default:
      throw new Error(`Fonte desconhecida: ${opts.source ?? "(vazia)"}.`);
  }
}

async function ingestTax(opts: Options) {
  switch (opts.source) {
    case "tipi":
    case "tec": {
      const file = requireFile(opts.file);
      const tributo = opts.source === "tipi" ? "IPI" : "II";
      return {
        provider: new OfficialTableProvider(tributo, file, opts.ato ?? null),
        fileHash: await sha256(file),
      };
    }
    case "legislacao": {
      const file = new URL("../../../data/legislacao/regras-gerais.csv", import.meta.url).pathname;
      return {
        provider: new TaxTemplateProvider(LEGISLACAO_SOURCE, file),
        fileHash: await sha256(file),
      };
    }
    case "arquivo": {
      const file = requireFile(opts.file);
      if (!opts.fonte) throw new Error('Informe a origem dos dados com --fonte "<nome da fonte>".');
      const source: SourceMetadata = {
        id: `arquivo-${slug(opts.fonte)}`,
        nome: opts.fonte,
        url: opts["fonte-url"] ?? null,
        licenca: null,
        descricao: "Arquivo importado no modelo próprio de tributos.",
        isMock: false,
      };
      return { provider: new TaxTemplateProvider(source, file), fileHash: await sha256(file) };
    }
    case "mock":
      refuseMockInProduction();
      return { provider: new MockTaxProvider() };
    default:
      throw new Error(`Fonte desconhecida: ${opts.source ?? "(vazia)"}.`);
  }
}

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      source: { type: "string" },
      file: { type: "string" },
      ato: { type: "string" },
      referencia: { type: "string" },
      fonte: { type: "string" },
      "fonte-url": { type: "string" },
    },
  });
  const command = positionals[0];
  if (command !== "ncm" && command !== "tributos") {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }

  const referencia = values.referencia ? parseSourceDate(values.referencia) : null;
  if (values.referencia && !referencia)
    throw new Error("Data de referência inválida. Use aaaa-mm-dd.");

  const db = createPrismaClient();
  try {
    if (command === "ncm") {
      const { provider, fileHash } = await ingestNcm(values);
      if (provider.source.isMock) console.warn("⚠  Carregando DADOS FICTÍCIOS de desenvolvimento.");
      console.log(formatReport(await runNcmIngestion(db, provider, { fileHash })));
    } else {
      const { provider, fileHash } = await ingestTax(values);
      if (provider.source.isMock) console.warn("⚠  Carregando DADOS FICTÍCIOS de desenvolvimento.");
      console.log(
        formatReport(
          await runTaxIngestion(db, provider, { fileHash, referencia: referencia ?? undefined }),
        ),
      );
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
  console.error(USAGE);
  process.exitCode = 1;
});
