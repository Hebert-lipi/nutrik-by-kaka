-- Regra de negócio: no máximo 1 plano publicado por paciente (patient_id não nulo).
-- RPC atómica para publicar e despublicar os demais do mesmo paciente.

-- ---------------------------------------------------------------------------
-- 1) Sanear dados existentes: manter só o publicado mais recente por paciente
-- ---------------------------------------------------------------------------

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY patient_id
      ORDER BY published_at DESC NULLS LAST, updated_at DESC
    ) AS rn
  FROM public.diet_plans
  WHERE status = 'published'
    AND patient_id IS NOT NULL
)
UPDATE public.diet_plans d
SET
  status = 'draft',
  published_at = NULL
FROM ranked r
WHERE d.id = r.id
  AND r.rn > 1;

-- ---------------------------------------------------------------------------
-- 2) Índice único parcial (garantia no banco)
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS diet_plans_one_published_per_patient_idx
  ON public.diet_plans (patient_id)
  WHERE status = 'published'
    AND patient_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) RPC: publicar um plano e despublicar todos os outros do mesmo paciente
-- ---------------------------------------------------------------------------

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

  -- Todos os planos desse paciente (deste nutricionista) voltam a rascunho
  UPDATE public.diet_plans
  SET
    status = 'draft',
    published_at = NULL
  WHERE patient_id = v_patient
    AND nutritionist_user_id = uid;

  -- Publica apenas o alvo
  UPDATE public.diet_plans
  SET
    status = 'published',
    published_at = now()
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

GRANT EXECUTE ON FUNCTION public.publish_diet_plan_for_patient(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Trigger: qualquer INSERT/UPDATE que marque published + patient_id
--    despublica os outros planos do mesmo paciente (mesmo nutricionista).
--    Cobre upsert do builder e clientes que não passem pela RPC.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.diet_plans_enforce_single_published()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.patient_id IS NOT NULL THEN
    UPDATE public.diet_plans
    SET
      status = 'draft',
      published_at = NULL
    WHERE patient_id = NEW.patient_id
      AND nutritionist_user_id = NEW.nutritionist_user_id
      AND id IS DISTINCT FROM NEW.id
      AND status = 'published';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS diet_plans_single_published_trg ON public.diet_plans;
CREATE TRIGGER diet_plans_single_published_trg
  BEFORE INSERT OR UPDATE OF status, patient_id, nutritionist_user_id ON public.diet_plans
  FOR EACH ROW
  EXECUTE PROCEDURE public.diet_plans_enforce_single_published();
