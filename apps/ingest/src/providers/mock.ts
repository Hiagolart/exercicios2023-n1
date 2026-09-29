import {
  ncmLevelOf,
  ok,
  type DataProvider,
  type NcmRecord,
  type ProviderBatch,
  type SourceMetadata,
} from "@comex/core";

export const MOCK_NCM_SOURCE: SourceMetadata = {
  id: "dev-mock-ncm",
  nome: "Dados fictícios de desenvolvimento",
  url: null,
  licenca: null,
  descricao:
    "Nomenclatura inventada para desenvolvimento e testes. Não corresponde à NCM oficial " +
    "e nunca deve ser usada em produção.",
  isMock: true,
};

// Códigos do capítulo 99 e descrições marcadas como fictícias, para não se
// confundirem com a nomenclatura oficial.
const MOCK_ROWS: [codigo: string, descricao: string][] = [
  ["99", "[FICTÍCIO] Capítulo de demonstração"],
  ["9901", "[FICTÍCIO] Equipamentos de movimentação (exemplo)"],
  ["990110", "[FICTÍCIO] Com motor elétrico (exemplo)"],
  ["99011010", "[FICTÍCIO] Modelo A de demonstração"],
  ["99011090", "[FICTÍCIO] Outros (exemplo)"],
  ["990190", "[FICTÍCIO] Outros equipamentos (exemplo)"],
  ["99019000", "[FICTÍCIO] Outros (exemplo)"],
  ["9902", "[FICTÍCIO] Partes e acessórios (exemplo)"],
  ["99020000", "[FICTÍCIO] Partes (exemplo)"],
];

export class MockNcmProvider implements DataProvider<NcmRecord> {
  readonly kind = "ncm" as const;
  readonly source = MOCK_NCM_SOURCE;

  async read(): Promise<ProviderBatch> {
    return { referenceDate: null, records: MOCK_ROWS };
  }

  validate(raw: unknown) {
    const [codigo, descricao] = raw as [string, string];
    const nivel = ncmLevelOf(codigo);
    if (!nivel) throw new Error(`Código fictício inválido: ${codigo}`);
    return ok<NcmRecord>({
      codigo,
      nivel,
      descricao,
      dataInicio: null,
      dataFim: null,
      atoTipo: null,
      atoNumero: null,
      atoAno: null,
    });
  }
}
