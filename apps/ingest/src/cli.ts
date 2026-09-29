import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { createPrismaClient } from "@comex/db";
import { runNcmIngestion } from "./pipeline/ncm";
import { ClassifNcmProvider } from "./providers/classif";
import { MockNcmProvider } from "./providers/mock";
import { fileReader, httpReader } from "./providers/readers";
import { formatReport } from "./report";

const USAGE = `Uso:
  pnpm ingest ncm --source classif            Baixa a NCM vigente da Receita Federal
  pnpm ingest ncm --source file --file <path>  Importa um JSON da NCM baixado manualmente
  pnpm ingest ncm --source mock                Carrega dados FICTÍCIOS (somente desenvolvimento)`;

const DEFAULT_CLASSIF_URL =
  "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json";

async function buildProvider(source: string | undefined, file: string | undefined) {
  switch (source) {
    case "classif":
      return {
        provider: new ClassifNcmProvider(
          httpReader(process.env.CLASSIF_NCM_URL ?? DEFAULT_CLASSIF_URL),
        ),
      };
    case "file": {
      if (!file) throw new Error("Informe --file <caminho>.");
      const hash = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
      return { provider: new ClassifNcmProvider(fileReader(file)), fileHash: hash };
    }
    case "mock":
      if (process.env.NODE_ENV === "production") {
        throw new Error("Dados fictícios não podem ser carregados em produção.");
      }
      return { provider: new MockNcmProvider() };
    default:
      throw new Error(`Fonte desconhecida: ${source ?? "(vazia)"}.`);
  }
}

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { source: { type: "string" }, file: { type: "string" } },
  });
  if (positionals[0] !== "ncm") {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }

  const { provider, fileHash } = await buildProvider(values.source, values.file);
  if (provider.source.isMock) console.warn("⚠  Carregando DADOS FICTÍCIOS de desenvolvimento.");

  const db = createPrismaClient();
  try {
    const report = await runNcmIngestion(db, provider, { fileHash });
    console.log(formatReport(report));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
  console.error(USAGE);
  process.exitCode = 1;
});
