import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-muted">O endereço não existe ou o código NCM não está na base.</p>
      <ButtonLink href="/dashboard" variant="secondary">
        Voltar ao dashboard
      </ButtonLink>
    </div>
  );
}
