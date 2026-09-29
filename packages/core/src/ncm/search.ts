import { z } from "zod";
import { isValidNcmCodeLength, normalizeNcmCode } from "./code";

/** Parâmetro de navegação da árvore: vazio (raiz) ou um código NCM existente. */
export const ncmTreeQuerySchema = z.object({
  parent: z
    .string()
    .trim()
    .max(12)
    .optional()
    .transform((v) => (v ? normalizeNcmCode(v) : null))
    .refine((v) => v === null || isValidNcmCodeLength(v), { message: "Código NCM inválido." }),
});

export type NcmTreeQuery = z.infer<typeof ncmTreeQuerySchema>;

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 120;

export type ParsedSearch =
  | { kind: "codigo"; digits: string }
  | { kind: "texto"; text: string }
  | { kind: "invalido"; motivo: string };

/**
 * Classifica o termo digitado. Entradas formadas só por dígitos e separadores
 * usuais de código ("8427.10.90", "8427 10") são tratadas como código; o resto,
 * como texto livre.
 */
export function parseNcmSearch(input: string): ParsedSearch {
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length < SEARCH_MIN_LENGTH) {
    return { kind: "invalido", motivo: `Digite pelo menos ${SEARCH_MIN_LENGTH} caracteres.` };
  }
  if (text.length > SEARCH_MAX_LENGTH) {
    return { kind: "invalido", motivo: `Use no máximo ${SEARCH_MAX_LENGTH} caracteres.` };
  }
  if (/^[\d.\-\s]+$/.test(text)) {
    const digits = normalizeNcmCode(text);
    if (digits.length < 2 || digits.length > 8) {
      return { kind: "invalido", motivo: "Um código NCM tem de 2 a 8 dígitos." };
    }
    return { kind: "codigo", digits };
  }
  return { kind: "texto", text };
}

export const ncmSearchQuerySchema = z.object({
  q: z.string().max(SEARCH_MAX_LENGTH * 2),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
