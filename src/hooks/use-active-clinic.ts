"use client";

import * as React from "react";
import { resolveActiveClinicId, setActiveClinicCookie } from "@/lib/clinic-context";
import { workspaceDualReadEnabled } from "@/lib/feature-flags";

export function useActiveClinic() {
  const [clinicId, setClinicId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(workspaceDualReadEnabled);

  React.useEffect(() => {
    if (!workspaceDualReadEnabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void resolveActiveClinicId().then((id) => {
      if (cancelled) return;
      setClinicId(id);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectClinic = React.useCallback((id: string | null) => {
    setActiveClinicCookie(id);
    setClinicId(id);
  }, []);

  return { clinicId, loading, enabled: workspaceDualReadEnabled, selectClinic };
}
