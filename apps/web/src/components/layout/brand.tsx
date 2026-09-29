import Link from "next/link";

/** Marca: nome com um marcador de "grade tarifária" em vez de logotipo genérico. */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span aria-hidden className="grid size-6 grid-cols-2 gap-0.5 rounded-sm bg-accent p-1">
        <span className="rounded-[1px] bg-accent-fg" />
        <span className="rounded-[1px] bg-accent-fg/50" />
        <span className="rounded-[1px] bg-accent-fg/50" />
        <span className="rounded-[1px] bg-accent-fg" />
      </span>
      Comex Intelligence
    </Link>
  );
}
