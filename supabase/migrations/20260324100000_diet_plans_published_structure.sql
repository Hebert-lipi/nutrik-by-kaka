-- Snapshot do que o paciente vê: `published_structure_json`
-- `structure_json` = rascunho em edição (nutricionista); ao publicar, copia-se para o snapshot.

ALTER TABLE public.diet_plans
  ADD COLUMN IF NOT EXISTS published_structure_json jsonb;

COMMENT ON COLUMN public.diet_plans.published_structure_json IS
  'JSON do plano visível ao paciente quando status = published. structure_json é a edição em curso.';

UPDATE public.diet_plans
SET published_structure_json = structure_json
WHERE status = 'published'
  AND published_structure_json IS NULL;

-- RPC: ao publicar, gravar snapshot = conteúdo atual (structure_json) e limpar snapshot dos demais despublicados
CREATE OR REPLACE FUNCTION public.publish_diet_plan_for_patient(p_plan_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_patient uuid;
  v_owner uuid;
  n int;
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT nutritionist_user_id, patient_id
  INTO v_owner, v_patient
  FROM public.diet_plans
  WHERE id = p_plan_id;

  IF v_owner IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'plan_not_found');
  END IF;

  IF v_owner <> uid THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_patient IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'plan_requires_patient');
  END IF;

  UPDATE public.diet_plans
  SET
    status = 'draft',
    published_at = NULL,
    published_structure_json = NULL
  WHERE patient_id = v_patient
    AND nutritionist_user_id = uid;

  UPDATE public.diet_plans
  SET
    status = 'published',
    published_at = now(),
    published_structure_json = structure_json
  WHERE id = p_plan_id
    AND nutritionist_user_id = uid
    AND patient_id = v_patient;

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RETURN json_build_object('ok', false, 'error', 'publish_failed');
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;
