import {
  ok,
  type DataProvider,
  type ProviderBatch,
  type SourceMetadata,
  type TaxDataRecord,
} from "@comex/core";

export const MOCK_TAX_SOURCE: SourceMetadata = {
  id: "dev-mock-tributos",
  nome: "Dados fictícios de desenvolvimento (tributos)",
  url: null,
  licenca: null,
  descricao: "Alíquotas inventadas para o capítulo fictício 99. Nunca usar em produção.",
  isMock: true,
};

const base = {
  regime: "geral",
  lista: null,
  tipo: "ad_valorem",
  vigenciaInicio: null,
  vigenciaFim: null,
  observacao: null,
  quota: null,
} as const;
const ATO = "[FICTÍCIO] Ato de demonstração";

// Alíquotas fictícias para o capítulo 99 (dados de desenvolvimento).
const MOCK_RECORDS: TaxDataRecord[] = [
  ...["99011010", "99011090", "99019000", "99020000"].flatMap((ncm, i): TaxDataRecord[] => [
    {
      kind: "aliquota",
      rate: { ...base, ncm, tributo: "II", aliquota: [14, 12.6, 18, 16][i] ?? 14, atoLegal: ATO },
    },
    {
      kind: "aliquota",
      rate: { ...base, ncm, tributo: "IPI", aliquota: [5, 3.25, 0, 6.5][i] ?? 5, atoLegal: ATO },
    },
  ]),
  {
    kind: "aliquota",
    rate: {
      ...base,
      ncm: "99011010",
      tributo: "II",
      regime: "excecao",
      lista: "[FICTÍCIO] LETEC",
      aliquota: 2,
      vigenciaInicio: new Date(Date.UTC(2026, 0, 1)),
      vigenciaFim: new Date(Date.UTC(2027, 11, 31)),
      atoLegal: ATO,
    },
  },
  {
    kind: "destaque",
    destaque: {
      ncm: "99011090",
      tributo: "II",
      numero: "001",
      descricao: "[FICTÍCIO] Equipamento de demonstração com capacidade acima de 5 t",
      tipo: "ad_valorem",
      aliquota: 0,
      vigenciaInicio: new Date(Date.UTC(2026, 2, 1)),
      vigenciaFim: new Date(Date.UTC(2027, 11, 31)),
      atoLegal: ATO,
      lista: null,
      quota: null,
      observacao: null,
    },
  },
];

export class MockTaxProvider implements DataProvider<TaxDataRecord> {
  readonly kind = "tariffs" as const;
  readonly source = MOCK_TAX_SOURCE;

  async read(): Promise<ProviderBatch> {
    return { referenceDate: null, records: MOCK_RECORDS };
  }

  validate(raw: unknown) {
    return ok(raw as TaxDataRecord);
  }
}
