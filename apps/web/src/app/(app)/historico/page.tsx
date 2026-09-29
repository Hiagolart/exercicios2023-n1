import type { Metadata } from "next";
import { clearSearchHistoryAction } from "@/app/actions/user";
import { HistoryList } from "@/components/ncm/history-list";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { userData } from "@/lib/data/user";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Histórico" };

export default async function HistoryPage() {
  const { user } = await requireSession();
  const searches = await userData.recentSearches(user.id, 200);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Histórico"
        description="Suas pesquisas mais recentes. Só você vê este histórico."
        actions={
          searches.length > 0 ? (
            <form action={clearSearchHistoryAction}>
              <Button variant="secondary" type="submit">
                Limpar histórico
              </Button>
            </form>
          ) : null
        }
      />
      <Section title="Pesquisas">
        {searches.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma pesquisa registrada.</p>
        ) : (
          <div className="-mx-5 -my-4">
            <HistoryList items={searches} />
          </div>
        )}
      </Section>
    </div>
  );
}
