-- FASE 3.2 — Cutover por flag (DB-side)
-- Objetivo: ativar caminho novo por runtime flag, mantendo rollback rápido.

-- ---------------------------------------------------------------------------
-- 1) Função operacional para alternar cutover com segurança
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_workspace_cutover(p_enabled boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid
      AND p.role = 'admin'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'admin_only');
  END IF;

  INSERT INTO public.runtime_flags (key, enabled, updated_at)
  VALUES ('workspace_cutover', p_enabled, now())
  ON CONFLICT (key) DO UPDATE
  SET enabled = EXCLUDED.enabled,
      updated_at = now();

  RETURN json_build_object('ok', true, 'workspace_cutover', p_enabled);
END;
$$;

REVOKE ALL ON FUNCTION public.set_workspace_cutover(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_workspace_cutover(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_cutover(boolean) TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Professional access requests: isolamento por clínica quando cutover ativo
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "professional_access_requests_select_admin" ON public.professional_access_requests;

CREATE POLICY "professional_access_requests_select_admin"
  ON public.professional_access_requests FOR SELECT
  TO authenticated
  USING (
    (
      NOT public.is_workspace_cutover_enabled()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      )
    )
    OR
    (
      public.is_workspace_cutover_enabled()
      AND target_clinic_id IS NOT NULL
      AND public.is_clinic_admin(target_clinic_id, auth.uid())
    )
  );
