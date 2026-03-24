"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { recordPerfMetric } from "@/lib/perf/perf-metrics";

export function RoutePerfTracker() {
  const pathname = usePathname();

  React.useEffect(() => {
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    let raf1 = 0;
    let raf2 = 0;
    // Mede quando a rota "assenta" no navegador após troca.
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
        recordPerfMetric("ui.route.settle", endedAt - startedAt, pathname);
      });
    });
    return () => {
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  return null;
}

