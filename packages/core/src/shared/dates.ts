const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Ano usado pelas fontes oficiais para indicar vigência sem data de término. */
const OPEN_ENDED_YEAR = 9999;

/**
 * Converte datas nos formatos `dd/mm/aaaa` ou ISO (`aaaa-mm-dd...`) para Date (UTC).
 * Retorna `null` para valores vazios e `undefined` para valores inválidos.
 */
export function parseSourceDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined) return null;
  // Planilhas (xlsx) entregam datas como objetos Date à meia-noite UTC.
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  // "-" é usado nas tabelas oficiais para "sem data".
  if (text === "" || text === "-") return null;

  const br = BR_DATE.exec(text);
  const iso = ISO_DATE.exec(text);
  const parts = br ? [br[3], br[2], br[1]] : iso ? [iso[1], iso[2], iso[3]] : null;
  if (!parts) return undefined;

  const [year, month, day] = parts.map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? date : undefined;
}

/** Datas de término "abertas" (ex.: 31/12/9999) são tratadas como ausência de término. */
export function normalizeEndDate(date: Date | null): Date | null {
  if (date && date.getUTCFullYear() >= OPEN_ENDED_YEAR) return null;
  return date;
}

/** Extrai a primeira data dd/mm/aaaa de um texto (ex.: "Vigente em 29/09/2026"). */
export function findDateInText(text: string): Date | null {
  const match = /(\d{2}\/\d{2}\/\d{4})/.exec(text);
  return match?.[1] ? (parseSourceDate(match[1]) ?? null) : null;
}
