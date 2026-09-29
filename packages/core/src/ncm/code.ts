/**
 * Utilitários para códigos da Nomenclatura Comum do Mercosul (NCM).
 *
 * Estrutura (dígitos):
 *   2 capítulo · 4 posição · 5–6 subposição · 7 item · 8 subitem
 */

export const NCM_LEVELS = ["capitulo", "posicao", "subposicao", "item", "subitem"] as const;
export type NcmLevel = (typeof NCM_LEVELS)[number];

export const NCM_LEVEL_LABELS: Record<NcmLevel, string> = {
  capitulo: "Capítulo",
  posicao: "Posição",
  subposicao: "Subposição",
  item: "Item",
  subitem: "Subitem",
};

const VALID_LENGTHS = new Set([2, 4, 5, 6, 7, 8]);

/** Mantém apenas os dígitos de um código digitado ou vindo de uma fonte ("8427.10.90" → "84271090"). */
export function normalizeNcmCode(input: string): string {
  return input.replace(/\D/g, "");
}

/** Indica se os dígitos formam um nível válido da NCM. */
export function isValidNcmCodeLength(digits: string): boolean {
  return /^\d+$/.test(digits) && VALID_LENGTHS.has(digits.length);
}

/** Código completo de 8 dígitos (nível em que as mercadorias são classificadas). */
export function isFullNcmCode(digits: string): boolean {
  return /^\d{8}$/.test(digits);
}

export function ncmLevelOf(digits: string): NcmLevel | null {
  switch (digits.length) {
    case 2:
      return "capitulo";
    case 4:
      return "posicao";
    case 5:
    case 6:
      return "subposicao";
    case 7:
      return "item";
    case 8:
      return "subitem";
    default:
      return null;
  }
}

/** Formata dígitos na notação usual: 84 · 84.27 · 8427.1 · 8427.10 · 8427.10.9 · 8427.10.90 */
export function formatNcmCode(digits: string): string {
  const d = normalizeNcmCode(digits);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 6) return `${d.slice(0, 4)}.${d.slice(4)}`;
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`;
}

export interface NcmStructure {
  capitulo: string;
  posicao: string | null;
  subposicao: string | null;
}

/** Decompõe um código nos seus níveis estruturais (dígitos). */
export function ncmStructureOf(digits: string): NcmStructure {
  return {
    capitulo: digits.slice(0, 2),
    posicao: digits.length >= 4 ? digits.slice(0, 4) : null,
    subposicao: digits.length >= 6 ? digits.slice(0, 6) : null,
  };
}
