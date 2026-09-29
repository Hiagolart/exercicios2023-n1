export type NcmStatus = "vigente" | "encerrada" | "futura";

export const NCM_STATUS_LABELS: Record<NcmStatus, string> = {
  vigente: "Vigente",
  encerrada: "Vigência encerrada",
  futura: "Vigência futura",
};

/** Situação de um código a partir das datas de vigência informadas pela fonte. */
export function ncmStatusOf(
  vigencia: { dataInicio: Date | null; dataFim: Date | null },
  today: Date = new Date(),
): NcmStatus {
  const t = today.getTime();
  if (vigencia.dataInicio && vigencia.dataInicio.getTime() > t) return "futura";
  if (vigencia.dataFim && vigencia.dataFim.getTime() < t) return "encerrada";
  return "vigente";
}
