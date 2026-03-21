import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { IconDashboard, IconDietPlan, IconUsers } from "./icons";

export type SidebarItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function Sidebar({ currentPath, mode = "dashboard" }: { currentPath: string; mode?: "dashboard" | "diet" }) {
  const items: SidebarItem[] = useMemo(
    () => [
      { href: "/dashboard", label: "Painel", icon: <IconDashboard className="text-neutral-600" /> },
      { href: "/patients", label: "Pacientes", icon: <IconUsers className="text-neutral-600" /> },
      { href: "/diet-plans", label: "Planos", icon: <IconDietPlan className="text-neutral-600" /> },
    ],
    [],
  );

  return (
    <aside
      className={cn(
        mode === "diet" ? "block shrink-0 md:block" : "hidden shrink-0 md:block",
        mode === "diet" ? "w-[88px]" : "w-[280px]",
      )}
    >
      <div
        className={cn(
          "h-full rounded-xl border border-neutral-200/80 bg-bg-0 shadow-card",
          mode === "diet" ? "p-2" : "p-4",
        )}
      >
        {mode === "dashboard" ? (
          <div className="border-b border-neutral-100 px-1 pb-4">
            <p className="text-body14 font-extrabold text-text-primary">Nutrik</p>
            <p className="mt-0.5 text-small12 text-text-muted">by Kaká · Gestão nutricional</p>
          </div>
        ) : null}

        <nav className={cn("space-y-1.5", mode === "diet" ? "mt-2 px-1" : "mt-4 px-1")}>
          {items.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center transition-colors font-semibold",
                  mode === "diet"
                    ? "h-11 w-11 justify-center rounded-xl border border-neutral-200/80 bg-bg-0 p-0"
                    : "gap-3 rounded-xl border border-transparent px-3 py-2.5 text-body14",
                  active
                    ? "bg-primary/12 text-primary ring-1 ring-primary/20"
                    : mode === "diet"
                      ? "text-neutral-600 hover:border-neutral-200 hover:bg-neutral-50"
                      : "text-text-secondary hover:border-neutral-200/80 hover:bg-neutral-50",
                )}
              >
                <span className={cn(active ? "text-primary" : undefined)}>{item.icon}</span>
                {mode === "dashboard" ? item.label : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

