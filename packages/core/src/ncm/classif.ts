import { z } from "zod";
import { findDateInText, normalizeEndDate, parseSourceDate } from "../shared/dates";
import { err, ok, type Result } from "../shared/result";
import type { ValidationIssue } from "../data-provider/types";
import { isValidNcmCodeLength, ncmLevelOf, normalizeNcmCode } from "./code";
import { cleanNcmDescription } from "./description";
import type { NcmRecord } from "./types";

/**
 * Parser do arquivo de nomenclatura publicado pela Receita Federal
 * (Portal Único Siscomex — sistema Classif).
 *
 * A documentação pública descreve os campos `codigo`, `descricao`, `dataInicio`,
 * `dataFim`, `tipoOrgaoAtoIni`, `numeroAtoIni` e `anoAtoIni`. Como o arquivo real
 * ainda não pôde ser baixado neste ambiente (Fase 0), o parser aceita também a
 * grafia com iniciais maiúsculas e underscores (ex.: `Codigo`, `Data_Inicio`).
 * Ajustar após a confirmação do formato.
 */

const FIELD_ALIASES = {
  codigo: ["codigo", "Codigo", "CO_NCM"],
  descricao: ["descricao", "Descricao", "NO_NCM_POR"],
  dataInicio: ["dataInicio", "Data_Inicio"],
  dataFim: ["dataFim", "Data_Fim"],
  atoTipo: ["tipoOrgaoAtoIni", "Tipo_Ato_Ini", "Tipo_Ato"],
  atoNumero: ["numeroAtoIni", "Numero_Ato_Ini", "Numero_Ato"],
  atoAno: ["anoAtoIni", "Ano_Ato_Ini", "Ano_Ato"],
} as const;

const ROOT_LIST_KEYS = ["Nomenclaturas", "nomenclaturas", "nomenclatura"] as const;
const ROOT_DATE_KEYS = ["dataUltimaAlteracao", "Data_Ultima_Atualizacao_NCM"] as const;

type RawObject = Record<string, unknown>;

function isObject(value: unknown): value is RawObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(obj: RawObject, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return undefined;
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

export interface ClassifPayload {
  /** Data da última alteração da base informada pela fonte, se houver. */
  dataUltimaAlteracao: Date | null;
  records: unknown[];
}

/** Extrai a lista de registros e a data da base do JSON bruto. */
export function parseClassifPayload(json: unknown): Result<ClassifPayload, string> {
  if (Array.isArray(json)) return ok({ dataUltimaAlteracao: null, records: json });
  if (!isObject(json)) return err("Formato não reconhecido: esperado objeto ou lista.");

  const list = pick(json, ROOT_LIST_KEYS);
  if (!Array.isArray(list)) {
    return err(
      `Lista de nomenclaturas não encontrada (chaves esperadas: ${ROOT_LIST_KEYS.join(", ")}).`,
    );
  }
  const rawDate = pick(json, ROOT_DATE_KEYS);
  // O arquivo oficial traz textos como "Vigente em 29/09/2026".
  const date =
    typeof rawDate === "string"
      ? (parseSourceDate(rawDate.split(" ")[0]) ?? findDateInText(rawDate))
      : null;
  return ok({ dataUltimaAlteracao: date ?? null, records: list });
}

const yearSchema = z.coerce.number().int().min(1900).max(2999);

/** Valida e normaliza um registro individual. */
export function parseClassifRecord(raw: unknown): Result<NcmRecord, ValidationIssue[]> {
  if (!isObject(raw)) return err([{ campo: "*", motivo: "Registro não é um objeto." }]);

  const issues: ValidationIssue[] = [];

  const rawCode = optionalText(pick(raw, FIELD_ALIASES.codigo));
  const codigo = rawCode ? normalizeNcmCode(rawCode) : "";
  const nivel = ncmLevelOf(codigo);
  if (!rawCode) issues.push({ campo: "codigo", motivo: "Código ausente." });
  else if (!isValidNcmCodeLength(codigo) || !nivel) {
    issues.push({ campo: "codigo", motivo: `Código inválido: "${rawCode}".` });
  }

  const rawDescription = optionalText(pick(raw, FIELD_ALIASES.descricao));
  const descricao = rawDescription ? cleanNcmDescription(rawDescription) : "";
  if (!descricao) issues.push({ campo: "descricao", motivo: "Descrição ausente." });

  const dataInicio = parseSourceDate(pick(raw, FIELD_ALIASES.dataInicio));
  if (dataInicio === undefined) issues.push({ campo: "dataInicio", motivo: "Data inválida." });
  const dataFim = parseSourceDate(pick(raw, FIELD_ALIASES.dataFim));
  if (dataFim === undefined) issues.push({ campo: "dataFim", motivo: "Data inválida." });

  const rawYear = optionalText(pick(raw, FIELD_ALIASES.atoAno));
  const year = rawYear === null ? null : yearSchema.safeParse(rawYear);
  if (year && !year.success)
    issues.push({ campo: "atoAno", motivo: `Ano inválido: "${rawYear}".` });

  if (issues.length > 0 || !nivel) return err(issues);

  return ok({
    codigo,
    nivel,
    descricao,
    dataInicio: dataInicio ?? null,
    dataFim: normalizeEndDate(dataFim ?? null),
    atoTipo: optionalText(pick(raw, FIELD_ALIASES.atoTipo)),
    atoNumero: optionalText(pick(raw, FIELD_ALIASES.atoNumero)),
    atoAno: year?.success ? year.data : null,
  });
}
