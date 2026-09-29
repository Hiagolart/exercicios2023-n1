"use server";

import { isValidNcmCodeLength, normalizeNcmCode } from "@comex/core";
import { clearSearchHistory, getPrisma, toggleFavorite } from "@comex/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";

/** Adiciona ou remove uma NCM dos favoritos do usuário autenticado. */
export async function toggleNcmFavoriteAction(codigo: string): Promise<{ favorito: boolean }> {
  const { user } = await requireSession();
  const digits = normalizeNcmCode(String(codigo));
  if (!isValidNcmCodeLength(digits)) throw new Error("Código NCM inválido.");

  const node = await getPrisma().ncmNode.findUnique({
    where: { codigo: digits },
    select: { id: true },
  });
  if (!node) throw new Error("NCM não encontrada.");

  const favorito = await toggleFavorite(getPrisma(), {
    userId: user.id,
    tipo: "ncm",
    referencia: digits,
  });
  revalidatePath("/favoritos");
  revalidatePath("/dashboard");
  return { favorito };
}

export async function clearSearchHistoryAction(): Promise<void> {
  const { user } = await requireSession();
  await clearSearchHistory(getPrisma(), user.id);
  revalidatePath("/historico");
  revalidatePath("/dashboard");
}
