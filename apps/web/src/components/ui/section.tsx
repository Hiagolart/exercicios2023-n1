import { cn } from "@/lib/cn";

/** Bloco com borda para agrupar conteúdo relacionado. */
export function Section({
  title,
  aside,
  children,
  className,
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-surface", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {aside}
        </div>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
