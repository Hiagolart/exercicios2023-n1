import type { Result } from "../shared/result";

/** Tipos de dado que um provedor pode fornecer. */
export type DataKind = "ncm" | "imports" | "companies" | "tariffs";

/** Metadados de proveniência, exibidos na interface e gravados a cada carga. */
export interface SourceMetadata {
  /** Identificador estável, ex.: "rfb-classif-ncm". */
  id: string;
  nome: string;
  url: string | null;
  licenca: string | null;
  descricao: string;
  /** Fontes fictícias devem ser rotuladas como tal em toda a interface. */
  isMock: boolean;
}

export interface ValidationIssue {
  campo: string;
  motivo: string;
}

/** Lote lido de uma fonte, antes da validação. */
export interface ProviderBatch {
  /** Data de referência informada pela própria fonte (ex.: última alteração da base). */
  referenceDate: Date | null;
  records: Iterable<unknown> | AsyncIterable<unknown>;
}

/**
 * Contrato para qualquer fonte de dados. Novas fontes (API, arquivo, fornecedor
 * licenciado) implementam esta interface sem alterar o restante do sistema.
 */
export interface DataProvider<TRecord> {
  readonly kind: DataKind;
  readonly source: SourceMetadata;
  read(): Promise<ProviderBatch>;
  validate(raw: unknown): Result<TRecord, ValidationIssue[]>;
}

export interface RejectedRecord {
  /** Posição do registro no lote (1-based). */
  linha: number;
  issues: ValidationIssue[];
}

/** Relatório de uma execução de carga. */
export interface IngestionReport {
  sourceId: string;
  processados: number;
  inseridos: number;
  atualizados: number;
  inalterados: number;
  rejeitados: number;
  erros: RejectedRecord[];
}
