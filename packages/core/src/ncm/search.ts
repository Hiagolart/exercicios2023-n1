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
