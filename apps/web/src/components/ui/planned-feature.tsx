import { PageHeader } from "./page-header";
import { Section } from "./section";

/** Página de módulo ainda não implementado, com a fase prevista no roadmap. */
export function PlannedFeature({
  title,
  description,
  phase,
  items,
  children,
}: {
  title: string;
  description: string;
  phase: string;
  items: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <Section title={`Previsto para a ${phase}`}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
      {children}
    </div>
  );
}
