import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getSession } from "./session";

/** Metadados de transparência presentes em toda resposta com dados. */
export interface ResponseMeta {
  fonte: { id: string; nome: string; url: string | null; isMock: boolean }[];
  atualizadoEm: string | null;
  metodologia?: string;
}

export function jsonData<T>(data: T, meta: ResponseMeta): NextResponse {
  return NextResponse.json({ data, meta });
}

export function jsonError(status: number, message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: { message, ...(details ? { details } : {}) } }, { status });
}

type Handler = (request: Request) => Promise<NextResponse>;

/**
 * Envolve um handler de API: exige sessão e converte exceções em resposta 500
 * genérica, sem vazar detalhes internos ao cliente.
 */
export function protectedRoute(handler: Handler): Handler {
  return async (request) => {
    try {
      const session = await getSession();
      if (!session) return jsonError(401, "Não autenticado.");
      return await handler(request);
    } catch (error) {
      console.error("[api]", error);
      return jsonError(500, "Erro interno. Tente novamente mais tarde.");
    }
  };
}

/** Valida os parâmetros de busca da URL com um schema zod. */
export function parseSearchParams<S extends z.ZodType>(
  request: Request,
  schema: S,
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const result = schema.safeParse(params);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    response: jsonError(
      400,
      "Parâmetros inválidos.",
      result.error.issues.map((i) => i.message),
    ),
  };
}
