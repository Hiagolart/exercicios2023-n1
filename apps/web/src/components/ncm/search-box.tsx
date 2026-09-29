import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

/** Campo de pesquisa por código, descrição ou produto. Envia para /ncm?q=. */
export function SearchBox({
  defaultValue,
  size = "md",
  autoFocus,
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}) {
  return (
    <form action="/ncm" method="get" role="search" className="w-full">
      <label htmlFor="q" className="sr-only">
        Pesquisar NCM
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-line bg-surface pl-3 focus-within:border-accent",
          size === "lg" ? "h-14" : "h-11",
        )}
      >
        <Search aria-hidden className="size-4 shrink-0 text-muted" />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          required
          minLength={2}
          maxLength={120}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Pesquise por NCM, descrição ou produto..."
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted",
            size === "lg" && "text-base",
          )}
        />
        <button
          type="submit"
          className="mr-1.5 h-[calc(100%-0.75rem)] rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
        >
          Pesquisar
        </button>
      </div>
    </form>
  );
}
