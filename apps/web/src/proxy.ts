import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Verificação otimista: sem cookie de sessão, redireciona para o login.
 * A validação real da sessão acontece no servidor (layout da área logada e APIs).
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/entrar", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ncm/:path*",
    "/importacoes/:path*",
    "/empresas/:path*",
    "/paises/:path*",
    "/produtos/:path*",
    "/analises/:path*",
    "/favoritos/:path*",
    "/historico/:path*",
    "/configuracoes/:path*",
  ],
};
