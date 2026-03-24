-- FASE 3.3 — Ferramentas de consolidação
-- Objetivo: checklist final + promoção controlada de constraints sem big bang.

CREATE OR REPLACE VIEW public.v_workspace_cutover_readiness AS
SELECT
  (SELECT COALESCE(enabled, false) FROM public.runtime_flags WHERE key = 'workspace_cutover') AS workspace_cutover_enabled,
  (SELECT COUNT(*) FROM public.profiles p
    LEFT JOIN public.clinic_members cm
      ON cm.user_id = p.id AND cm.member_status = 'active'
    WHERE p.role IN ('nutritionist', 'admin') AND cm.id IS NULL) AS missing_clinical_members,
  (SELECT COUNT(*) FROM public.patients WHERE clinic_id IS NULL) AS patients_without_clinic,
  (SELECT COUNT(*) FROM public.patients p
    LEFT JOIN public.patient_clinic_links pcl ON pcl.patient_id = p.id
    WHERE pcl.id IS NULL) AS patients_without_link,
  (SELECT COUNT(*) FROM public.patient_clinic_links pcl
    LEFT JOIN public.patients p ON p.id = pcl.patient_id
    LEFT JOIN public.clinics c ON c.id = pcl.clinic_id
    WHERE p.id IS NULL OR c.id IS NULL) AS orphan_patient_clinic_links,
  (SELECT COUNT(*) FROM public.professional_access_requests WHERE target_clinic_id IS NULL) AS requests_without_target_clinic;

COMMENT ON VIEW public.v_workspace_cutover_readiness IS
  'Gate de readiness para consolidação final do cutover multi-clínica.';

CREATE OR REPLACE FUNCTION public.workspace_finalize_constraints()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_missing_members bigint;
  v_missing_patients bigint;
  v_missing_links bigint;
  v_orphans bigint;
  v_missing_requests bigint;
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

  SELECT
    missing_clinical_members,
    patients_without_clinic,
    patients_without_link,
    orphan_patient_clinic_links,
    requests_without_target_clinic
  INTO
    v_missing_members,
    v_missing_patients,
    v_missing_links,
    v_orphans,
    v_missing_requests
  FROM public.v_workspace_cutover_readiness;

  IF v_missing_members > 0 OR v_missing_patients > 0 OR v_missing_links > 0 OR v_orphans > 0 OR v_missing_requests > 0 THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'readiness_failed',
      'missing_clinical_members', v_missing_members,
      'patients_without_clinic', v_missing_patients,
      'patients_without_link', v_missing_links,
      'orphan_patient_clinic_links', v_orphans,
      'requests_without_target_clinic', v_missing_requests
    );
  END IF;

  ALTER TABLE public.patients VALIDATE CONSTRAINT patients_clinic_id_required_ck;
  ALTER TABLE public.professional_access_requests VALIDATE CONSTRAINT professional_access_requests_target_clinic_required_ck;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.workspace_finalize_constraints() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.workspace_finalize_constraints() TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_finalize_constraints() TO service_role;
