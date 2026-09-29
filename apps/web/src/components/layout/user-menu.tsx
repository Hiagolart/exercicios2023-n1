"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 border-t border-line pt-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-50"
        aria-label="Sair"
        title="Sair"
      >
        <LogOut aria-hidden className="size-4" />
      </button>
    </div>
  );
}
