import type { Metadata } from "next";
import Link from "next/link";
import { MockDataBanner } from "@/components/data/mock-banner";
import { SourceNote } from "@/components/data/source-note";
import { FavoriteList } from "@/components/ncm/favorite-list";
import { HistoryList } from "@/components/ncm/history-list";
import { SearchBox } from "@/components/ncm/search-box";
import { Section } from "@/components/ui/section";
import { ncmData } from "@/lib/data/ncm";
import { userData } from "@/lib/data/user";
import { formatDate, formatDateTime, formatInteger } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const EXAMPLES = ["8427.10", "Empilhadeira elétrica", "Paleteira elétrica"];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="font-mono text-2xl tabular-nums">{value}</dd>
      {hint ? <dd className="text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs text-accent hover:underline">
      Ver tudo
    </Link>
  );
}

export default async function DashboardPage() {
  const { user } = await requireSession();
  const [stats, run, recent, favorites, top] = await Promise.all([
    ncmData.stats(),
    ncmData.latestRun(),
    userData.recentSearches(user.id, 6),
    userData.favoriteNcms(user.id, 6),
    userData.topSearches(user.id, 5),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {user.name.split(" ")[0]}</h1>
        <SearchBox size="lg" />
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          Exemplos:
          {EXAMPLES.map((example) => (
            <Link
              key={example}
              href={`/ncm?q=${encodeURIComponent(example)}`}
              className="text-accent hover:underline"
            >
              {example}
            </Link>
          ))}
        </p>
      </section>

      {run?.source.isMock ? <MockDataBanner /> : null}

      <Section title="Base de dados">
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <Stat
            label="NCMs (8 dígitos)"
            value={stats.subitens > 0 ? formatInteger(stats.subitens) : "—"}
            hint={
              stats.total > 0
                ? `${formatInteger(stats.total)} códigos na estrutura`
                : "Nenhuma carga realizada"
            }
          />
          <Stat
            label="Capítulos"
            value={stats.capitulos > 0 ? formatInteger(stats.capitulos) : "—"}
          />
          <Stat label="Registros de importação" value="—" hint="Disponível na Fase 6" />
          <Stat label="Período dos dados" value="—" hint="Disponível na Fase 6" />
        </dl>
        <div className="mt-6 border-t border-line pt-4">
          <SourceNote
            fonte={run?.source ?? null}
            referencia={formatDate(run?.referenceDate)}
            atualizadoEm={formatDateTime(run?.finishedAt)}
          />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Pesquisas recentes"
          aside={recent.length > 0 ? <SeeAll href="/historico" /> : null}
        >
          {recent.length === 0 ? (
            <p className="text-sm text-muted">Suas pesquisas aparecerão aqui.</p>
          ) : (
            <div className="-mx-5 -my-4">
              <HistoryList items={recent} />
            </div>
          )}
        </Section>
        <Section
          title="NCMs favoritas"
          aside={favorites.length > 0 ? <SeeAll href="/favoritos" /> : null}
        >
          {favorites.length === 0 ? (
            <p className="text-sm text-muted">
              Use “Adicionar aos favoritos” na página de uma NCM.
            </p>
          ) : (
            <div className="-mx-5 -my-4">
              <FavoriteList items={favorites} />
            </div>
          )}
        </Section>
      </div>

      <Section title="Seus termos mais pesquisados">
        {top.length === 0 ? (
          <p className="text-sm text-muted">Ainda não há pesquisas suficientes.</p>
        ) : (
          <ol className="flex flex-wrap gap-2">
            {top.map((t) => (
              <li key={t.termo}>
                <Link
                  href={`/ncm?q=${encodeURIComponent(t.termo)}`}
                  className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-surface-2"
                >
                  {t.termo}
                  <span className="font-mono text-xs tabular-nums text-muted">{t.total}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
