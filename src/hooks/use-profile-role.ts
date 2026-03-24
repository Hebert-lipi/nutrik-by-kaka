"use client";

import * as React from "react";
import type { UserRole } from "@/lib/auth/user-context";
import { fetchMyProfileRole } from "@/lib/supabase/professional-access-requests";

export function useProfileRole() {
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let c = false;
    void fetchMyProfileRole().then((r) => {
      if (c) return;
      setRole(r);
      setLoading(false);
    });
    return () => {
      c = true;
    };
  }, []);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isClinicalStaff: role === "nutritionist" || role === "admin",
  };
}
