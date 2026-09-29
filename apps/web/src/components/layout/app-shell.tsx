"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar";
import { UserMenu } from "./user-menu";

interface AppShellProps {
  user: { name: string; email: string };
  footer: React.ReactNode;
  children: React.ReactNode;
}

/** Estrutura da área autenticada: menu lateral fixo no desktop e gaveta no celular. */
export function AppShell({ user, footer, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <div className="px-3">
        <Brand href="/dashboard" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav onNavigate={() => setOpen(false)} />
      </div>
      <div className="px-3">
        <UserMenu {...user} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Brand href="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted hover:bg-surface-2"
          aria-label="Abrir menu"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-fg/30"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-md p-2 text-muted hover:bg-surface-2"
              aria-label="Fechar menu"
            >
              <X aria-hidden className="size-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-8">{footer}</footer>
      </div>
    </div>
  );
}
