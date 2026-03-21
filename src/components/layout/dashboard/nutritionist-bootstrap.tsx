"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * - Executa claim de paciente (noop para nutricionista).
 * - Se o usuário é só paciente (vinculado por e-mail e sem dados como nutricionista), redireciona para /meu-plano.
 */
export function NutritionistBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await supabase.rpc("claim_patient_by_email");
      } catch {
        /* tabela/RPC ainda não criados — não bloqueia o app */
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;

      const [c1, c2, c3] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("nutritionist_user_id", user.id),
        supabase.from("diet_plans").select("id", { count: "exact", head: true }).eq("nutritionist_user_id", user.id),
        supabase.from("patients").select("id").eq("auth_user_id", user.id).maybeSingle(),
      ]);

      if (c1.error || c2.error || c3.error) return;

      const hasNutriWorkspace = (c1.count ?? 0) > 0 || (c2.count ?? 0) > 0;
      const isLinkedPatient = Boolean(c3.data?.id);

      if (isLinkedPatient && !hasNutriWorkspace) {
        router.replace("/meu-plano");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}
