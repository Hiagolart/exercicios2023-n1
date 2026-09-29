import { FiscalDisclaimer } from "@/components/data/disclaimer";
import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  return (
    <AppShell user={{ name: user.name, email: user.email }} footer={<FiscalDisclaimer />}>
      {children}
    </AppShell>
  );
}
