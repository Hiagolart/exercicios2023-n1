"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Mode = "entrar" | "cadastro";

const COPY: Record<Mode, { title: string; submit: string; alt: React.ReactNode }> = {
  entrar: {
    title: "Entrar",
    submit: "Entrar",
    alt: (
      <>
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-accent hover:underline">
          Criar conta
        </Link>
      </>
    ),
  },
  cadastro: {
    title: "Criar conta",
    submit: "Criar conta",
    alt: (
      <>
        Já tem conta?{" "}
        <Link href="/entrar" className="text-accent hover:underline">
          Entrar
        </Link>
      </>
    ),
  },
};

const inputClass =
  "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-accent";

/** Mensagens próprias, sem repassar detalhes técnicos do servidor. */
function messageFor(status: number | undefined, mode: Mode): string {
  if (status === 429) return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  if (mode === "entrar") return "E-mail ou senha incorretos.";
  if (status === 422 || status === 400)
    return "Não foi possível criar a conta. Verifique os dados ou use outro e-mail.";
  return "Não foi possível concluir. Tente novamente.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const copy = COPY[mode];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const { error: authError } =
      mode === "entrar"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get("name") ?? "") });

    setPending(false);
    if (authError) {
      setError(messageFor(authError.status, mode));
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">{copy.title}</h1>
      {mode === "cadastro" ? (
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input
            id="name"
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            className={inputClass}
          />
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        E-mail
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Senha
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={128}
          autoComplete={mode === "entrar" ? "current-password" : "new-password"}
          className={inputClass}
        />
        {mode === "cadastro" ? (
          <span className="text-xs text-muted">Mínimo de 10 caracteres.</span>
        ) : null}
      </label>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Aguarde…" : copy.submit}
      </Button>
      <p className="text-center text-sm text-muted">{copy.alt}</p>
    </form>
  );
}
