import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type AuthSession } from "./auth";

export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Garante uma sessão válida em páginas protegidas; redireciona para o login caso contrário. */
export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) redirect("/entrar");
  return session;
}
