import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/brand-logo";
import { IconDashboard, IconDietPlan, IconUsers } from "./icons";

export type SidebarItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function Sidebar({ currentPath }: { currentPath: string }) {
  const items: SidebarItem[] = useMemo(
    () => [
      { href: "/dashboard", label: "Painel", icon: <IconDashboard className="h-5 w-5" /> },
      { href: "/patients", label: "Pacientes", icon: <IconUsers className="h-5 w-5" /> },
      { href: "/diet-plans", label: "Planos", icon: <IconDietPlan className="h-5 w-5" /> },
    ],
    [],
  );

  return (
    <aside className="nutrik-print-hide hidden w-[272px] shrink-0 md:block">
      <div className="flex h-full min-h-[calc(100dvh-2rem)] flex-col rounded-2xl border border-neutral-200/50 bg-bg-0/95 p-4 shadow-card ring-1 ring-black/[0.02] backdrop-blur-sm md:min-h-[calc(100dvh-3rem)]">
        <div className="flex items-center gap-3 border-b border-neutral-100/90 pb-5">
          <BrandLogo size={44} />
          <div className="min-w-0">
            <p className="truncate font-extrabold tracking-tight text-text-primary">Nutrik</p>
            <p className="truncate text-small12 font-medium text-text-muted">by Kaká</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {items.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-body14 font-semibold transition-all duration-200",
                  active
                    ? "bg-primary/[0.14] text-text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-text-secondary hover:bg-neutral-50 hover:text-text-primary",
                )}
              >
                <span className={cn(active ? "text-primary" : "text-neutral-500")}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <p className="px-1 text-[11px] font-medium leading-relaxed text-text-muted/90">
            Interface clínica · dados exibidos conforme seus cadastros
          </p>
        </div>
      </div>
    </aside>
  );
}
