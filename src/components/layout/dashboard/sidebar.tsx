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
      { href: "/dashboard", label: "Dashboard", icon: <IconDashboard className="text-neutral-600" /> },
      { href: "/patients", label: "Patients", icon: <IconUsers className="text-neutral-600" /> },
      { href: "/diet-plans", label: "Diet Plans", icon: <IconDietPlan className="text-neutral-600" /> },
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
      <div className={cn("h-full rounded-xl bg-bg-0 shadow-soft", mode === "diet" ? "p-2" : "p-3")}>
        {mode === "dashboard" ? (
          <div className="px-2 pb-2">
            <p className="text-body14 font-bold text-text-secondary">Nutrik</p>
            <p className="text-small12 text-neutral-500">Nutrition MVP</p>
          </div>
        ) : null}

        <nav className={cn("mt-2 space-y-1", mode === "diet" ? "px-1" : "px-2")}>
          {items.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center transition-colors font-semibold",
                  mode === "diet"
                    ? "justify-center rounded-xl h-11 w-11 p-0 border border-neutral-200 bg-bg-0"
                    : "gap-3 rounded-lg px-3 py-2 text-body14",
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : mode === "diet"
                      ? "text-neutral-600 hover:bg-neutral-100/70 hover:border hover:border-neutral-200"
                      : "text-text-secondary hover:bg-neutral-100/70 hover:border hover:border-neutral-200",
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

