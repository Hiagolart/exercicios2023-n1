import { formatNcmCode } from "@comex/core";
import { cn } from "@/lib/cn";

export function NcmCode({ codigo, className }: { codigo: string; className?: string }) {
  return (
    <span className={cn("font-mono tabular-nums tracking-tight", className)}>
      {formatNcmCode(codigo)}
    </span>
  );
}
