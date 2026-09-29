import type { Metadata } from "next";
import Link from "next/link";
import { FavoriteList } from "@/components/ncm/favorite-list";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { userData } from "@/lib/data/user";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const { user } = await requireSession();
  const favorites = await userData.favoriteNcms(user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Meus favoritos" description="NCMs salvas para acesso rápido." />
      <Section title="NCMs" aside={<span className="text-xs text-muted">{favorites.length}</span>}>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhuma NCM favorita ainda. Abra uma NCM na{" "}
            <Link href="/ncm" className="text-accent hover:underline">
              Pesquisa NCM
            </Link>{" "}
            e use “Adicionar aos favoritos”.
          </p>
        ) : (
          <div className="-mx-5 -my-4">
            <FavoriteList items={favorites} />
          </div>
        )}
      </Section>
      <p className="text-xs text-muted">
        Favoritos de produtos, empresas e países chegam com os respectivos módulos.
      </p>
    </div>
  );
}
