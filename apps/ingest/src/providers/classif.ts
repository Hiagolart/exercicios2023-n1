import {
  parseClassifPayload,
  parseClassifRecord,
  type DataProvider,
  type NcmRecord,
  type ProviderBatch,
  type SourceMetadata,
} from "@comex/core";

export const CLASSIF_SOURCE: SourceMetadata = {
  id: "rfb-classif-ncm",
  nome: "Receita Federal — Nomenclatura Comum do Mercosul (Classif / Portal Único Siscomex)",
  url: "https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/download-ncm-nomenclatura-comum-do-mercosul",
  licenca: null,
  descricao:
    "Tabela NCM vigente na data do download, publicada pela Receita Federal. " +
    "Não inclui códigos extintos nem códigos com vigência futura.",
  isMock: false,
};

/** Lê o conteúdo bruto (texto JSON) de algum lugar: HTTP, arquivo local etc. */
export type TextReader = () => Promise<string>;

/**
 * Provedor da nomenclatura oficial. A origem do texto é injetada, para que o
 * mesmo parser sirva ao download direto e a um arquivo baixado manualmente.
 */
export class ClassifNcmProvider implements DataProvider<NcmRecord> {
  readonly kind = "ncm" as const;
  readonly source = CLASSIF_SOURCE;

  constructor(private readonly readText: TextReader) {}

  async read(): Promise<ProviderBatch> {
    const text = await this.readText();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("O conteúdo recebido não é um JSON válido.");
    }
    const payload = parseClassifPayload(json);
    if (!payload.ok) throw new Error(payload.error);
    return { referenceDate: payload.value.dataUltimaAlteracao, records: payload.value.records };
  }

  validate(raw: unknown) {
    return parseClassifRecord(raw);
  }
}
