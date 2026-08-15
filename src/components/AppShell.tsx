import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Coins,
  TrendingUp,
  PieChart,
  Banknote,
  LineChart,
  Target,
  NotebookPen,
  Upload,
  Settings,
  Menu,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portefeuille", label: "Portefeuille", icon: Wallet },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/investissements", label: "Investissements", icon: Coins },
  { to: "/performance", label: "Performance", icon: TrendingUp },
  { to: "/allocation", label: "Allocation", icon: PieChart },
  { to: "/revenus", label: "Revenus", icon: Banknote },
  { to: "/projections", label: "Projections", icon: LineChart },
  { to: "/objectifs", label: "Objectifs", icon: Target },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/import", label: "Import CSV", icon: Upload },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-brass")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);




  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-6 lg:flex lg:sticky lg:top-0 lg:h-screen">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="px-3 pt-4">
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{user.email}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand compact />
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      {open && (
        <div className="fixed inset-0 top-[57px] z-30 overflow-y-auto bg-sidebar pb-10 pt-4 lg:hidden">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-10 lg:py-12">{children}</main>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", compact ? "" : "px-6")}>
      <span className="flex size-7 items-center justify-center rounded-sm bg-brass text-[13px] font-semibold text-primary-foreground">
        P
      </span>
      <span className="font-serif text-xl leading-none">Patrimonia</span>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl lg:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
