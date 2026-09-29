import {
  BarChart3,
  Building2,
  Calculator,
  Globe2,
  History,
  LayoutDashboard,
  LineChart,
  Package,
  Search,
  Settings,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ncm", label: "Pesquisa NCM", icon: Search },
  { href: "/simulador", label: "Simulador de tributos", icon: Calculator },
  { href: "/importacoes", label: "Inteligência de Importações", icon: BarChart3 },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/paises", label: "Países", icon: Globe2 },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/analises", label: "Análises", icon: LineChart },
  { href: "/favoritos", label: "Favoritos", icon: Star },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/** Um item está ativo na sua rota e em qualquer sub-rota. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
