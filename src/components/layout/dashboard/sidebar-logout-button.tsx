"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { IconLogout } from "./icons";

type SidebarLogoutButtonProps = {
  className?: string;
  /** Ex.: fechar drawer mobile após logout */
  onAfterSignOut?: () => void;
};

export function SidebarLogoutButton({ className, onAfterSignOut }: SidebarLogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      onAfterSignOut?.();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleSignOut}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent",
        "bg-neutral-100/95 py-2.5 pl-5 pr-5 text-[13px] font-medium leading-none text-neutral-600",
        "transition-colors duration-150 hover:bg-neutral-200/90 hover:text-neutral-700",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      <IconLogout className="shrink-0 text-neutral-500 [&_svg]:h-[18px] [&_svg]:w-[18px]" />
      {loading ? "A sair…" : "Sair"}
    </button>
  );
}
