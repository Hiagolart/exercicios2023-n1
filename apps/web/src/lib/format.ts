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

const TZ = "America/Sao_Paulo";
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

/** Dia civil no horário de Brasília, no formato aaaa-mm-dd. */
export function dayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

/** Rótulo do dia para listas de histórico: "Hoje", "Ontem" ou a data. */
export function relativeDayLabel(date: Date, now: Date = new Date()): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return "Hoje";
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return "Ontem";
  return dateFormatter.format(new Date(`${key}T00:00:00Z`));
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}
