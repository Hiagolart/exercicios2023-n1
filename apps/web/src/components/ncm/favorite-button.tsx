"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleNcmFavoriteAction } from "@/app/actions/user";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function FavoriteButton({ codigo, initial }: { codigo: string; initial: boolean }) {
  const [favorito, setFavorito] = useState(initial);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setError(false);
    startTransition(async () => {
      try {
        const result = await toggleNcmFavoriteAction(codigo);
        setFavorito(result.favorito);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={favorito}
        className={buttonClass("secondary")}
      >
        <Star aria-hidden className={cn("size-4", favorito && "fill-accent text-accent")} />
        {favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-danger">
          Não foi possível salvar. Tente novamente.
        </span>
      ) : null}
    </div>
  );
}
