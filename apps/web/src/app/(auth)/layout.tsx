import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Brand />
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6">{children}</div>
    </div>
  );
}
