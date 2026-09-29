import { MOCK_DATA_LABEL } from "@comex/core";
import { TriangleAlert } from "lucide-react";

/** Aviso obrigatório sempre que dados fictícios estiverem visíveis. */
export function MockDataBanner({ detail }: { detail?: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-warn-line bg-warn-bg px-3 py-2 text-sm text-warn-fg"
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>
        <strong className="font-semibold">{MOCK_DATA_LABEL}.</strong>{" "}
        {detail ?? "Os códigos e descrições exibidos não correspondem à NCM oficial."}
      </p>
    </div>
  );
}
