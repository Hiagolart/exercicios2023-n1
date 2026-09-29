import type { IngestionReport } from "@comex/core";

const MAX_PRINTED_ERRORS = 20;

/** Formata o relatório de carga para o terminal. */
export function formatReport(report: IngestionReport): string {
  const lines = [
    `Fonte:        ${report.sourceId}`,
    `Processados:  ${report.processados}`,
    `Inseridos:    ${report.inseridos}`,
    `Atualizados:  ${report.atualizados}`,
    `Inalterados:  ${report.inalterados}`,
    `Rejeitados:   ${report.rejeitados}`,
  ];
  if (report.erros.length > 0) {
    lines.push("", "Erros encontrados:");
    for (const { linha, issues } of report.erros.slice(0, MAX_PRINTED_ERRORS)) {
      lines.push(`  linha ${linha}: ${issues.map((i) => `${i.campo} — ${i.motivo}`).join("; ")}`);
    }
    const remaining = report.erros.length - MAX_PRINTED_ERRORS;
    if (remaining > 0) lines.push(`  … e mais ${remaining} registro(s) rejeitado(s).`);
  }
  return lines.join("\n");
}
