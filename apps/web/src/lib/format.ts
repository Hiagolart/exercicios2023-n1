const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const integerFormatter = new Intl.NumberFormat("pt-BR");

/** Datas "de calendário" (sem hora), armazenadas em UTC. */
export function formatDate(date: Date | null | undefined): string | null {
  return date ? dateFormatter.format(date) : null;
}

/** Instantes (ex.: fim de uma carga), exibidos no horário de Brasília. */
export function formatDateTime(date: Date | null | undefined): string | null {
  return date ? dateTimeFormatter.format(date) : null;
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}
