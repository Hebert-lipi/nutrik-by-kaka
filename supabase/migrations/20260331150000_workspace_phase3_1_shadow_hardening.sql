-- FASE 3.1 — Shadow hardening (sem cutover geral)
-- Objetivo: preparar autorização clínica v2 + constraints progressivas + gate por runtime flag.

-- ---------------------------------------------------------------------------
-- 1) Runtime flag para cutover de autorização clínica
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.runtime_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.runtime_flags (key, enabled)
VALUES ('workspace_cutover', false)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_workspace_cutover_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT rf.enabled FROM public.runtime_flags rf WHERE rf.key = 'workspace_cutover'),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_cutover_enabled() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_cutover_enabled() TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Helpers v2 de autorização por clínica
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_active_clinic_member(
  p_clinic_id uuid,
  p_uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinic_members cm
    WHERE cm.clinic_id = p_clinic_id
      AND cm.user_id = p_uid
      AND cm.member_status = 'active'::public.clinic_member_status
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_clinic_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_clinic_member(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.is_clinic_nutritionist(
  p_clinic_id uuid,
  p_uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinic_members cm
    WHERE cm.clinic_id = p_clinic_id
      AND cm.user_id = p_uid
      AND cm.role = 'nutritionist'::public.clinic_member_role
      AND cm.member_status = 'active'::public.clinic_member_status
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_clinic_nutritionist(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinic_nutritionist(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.can_access_patient_v2(
  p_patient_id uuid,
  p_patient_clinic_id uuid,
  p_patient_owner uuid,
  p_uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode public.clinic_visibility_mode;
BEGIN
  IF p_uid IS NULL OR p_patient_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_clinic_admin(p_patient_clinic_id, p_uid) THEN
    RETURN true;
  END IF;

  IF NOT public.is_clinic_nutritionist(p_patient_clinic_id, p_uid) THEN
    RETURN false;
  END IF;

  SELECT cs.nutritionist_visibility_mode
  INTO v_mode
  FROM public.clinic_settings cs
  WHERE cs.clinic_id = p_patient_clinic_id;

  IF COALESCE(v_mode, 'own_only'::public.clinic_visibility_mode) = 'clinic_shared'::public.clinic_visibility_mode THEN
    RETURN true;
  END IF;

  IF p_patient_owner = p_uid THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.patient_care_team pct
    WHERE pct.patient_id = p_patient_id
      AND pct.clinic_id = p_patient_clinic_id
      AND pct.nutritionist_user_id = p_uid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_access_patient_v2(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_patient_v2(uuid, uuid, uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 3) Policies de patients com gate de cutover (legacy OR v2)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_select_own_patients" ON public.patients;
DROP POLICY IF EXISTS "nutritionist_insert_own_patients" ON public.patients;
DROP POLICY IF EXISTS "nutritionist_update_own_patients" ON public.patients;
DROP POLICY IF EXISTS "nutritionist_delete_own_patients" ON public.patients;

CREATE POLICY "nutritionist_select_own_patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    (
      NOT public.is_workspace_cutover_enabled()
      AND nutritionist_user_id = auth.uid()
      AND public.is_clinical_staff(auth.uid())
    )
    OR
    (
      public.is_workspace_cutover_enabled()
      AND public.can_access_patient_v2(id, clinic_id, nutritionist_user_id, auth.uid())
    )
  );

CREATE POLICY "nutritionist_insert_own_patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      NOT public.is_workspace_cutover_enabled()
      AND nutritionist_user_id = auth.uid()
      AND public.is_clinical_staff(auth.uid())
    )
    OR
    (
      public.is_workspace_cutover_enabled()
      AND clinic_id IS NOT NULL
      AND public.is_active_clinic_member(clinic_id, auth.uid())
      AND (
        public.is_clinic_admin(clinic_id, auth.uid())
        OR nutritionist_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "nutritionist_update_own_patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    (
      NOT public.is_workspace_cutover_enabled()
      AND nutritionist_user_id = auth.uid()
      AND public.is_clinical_staff(auth.uid())
    )
    OR
    (
      public.is_workspace_cutover_enabled()
      AND public.can_access_patient_v2(id, clinic_id, nutritionist_user_id, auth.uid())
    )
  )
  WITH CHECK (
    (
      NOT public.is_workspace_cutover_enabled()
      AND nutritionist_user_id = auth.uid()
      AND public.is_clinical_staff(auth.uid())
    )
    OR
    (
      public.is_workspace_cutover_enabled()
      AND clinic_id IS NOT NULL
      AND public.is_active_clinic_member(clinic_id, auth.uid())
      AND (
        public.is_clinic_admin(clinic_id, auth.uid())
        OR nutritionist_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "nutritionist_delete_own_patients"
  ON public.patients FOR DELETE
  TO authenticated
  USING (
    (
      NOT public.is_workspace_cutover_enabled()
      AND nutritionist_user_id = auth.uid()
      AND public.is_clinical_staff(auth.uid())
    )
    OR
    (
      public.is_workspace_cutover_enabled()
      AND clinic_id IS NOT NULL
      AND public.is_clinic_admin(clinic_id, auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Constraints progressivas (NOT VALID)
-- ---------------------------------------------------------------------------

ALTER TABLE public.patients
  ADD CONSTRAINT patients_clinic_id_required_ck
  CHECK (clinic_id IS NOT NULL) NOT VALID;

ALTER TABLE public.professional_access_requests
  ADD CONSTRAINT professional_access_requests_target_clinic_required_ck
  CHECK (target_clinic_id IS NOT NULL) NOT VALID;
