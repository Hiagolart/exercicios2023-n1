import type { NcmLevel } from "./code";

/** Registro de nomenclatura normalizado, independente da fonte. */
export interface NcmRecord {
  /** Somente dígitos (2 a 8). */
  codigo: string;
  nivel: NcmLevel;
  descricao: string;
  dataInicio: Date | null;
  dataFim: Date | null;
  atoTipo: string | null;
  atoNumero: string | null;
  atoAno: number | null;
}
