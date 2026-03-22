"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Executa claim paciente ↔ auth (mesmo e-mail) no cliente após navegação.
 * O controlo de rotas (paciente vs nutricionista) fica no middleware + `getUserContext`.
 */
export function NutritionistBootstrap({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void (async () => {
      const { error } = await supabase.rpc("claim_patient_by_email");
      if (error) {
        /* RPC/tabela ausente — não bloqueia */
      }
    })();
  }, []);

  return <>{children}</>;
}
