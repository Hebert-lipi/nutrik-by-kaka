-- Listagens rápidas: metadados derivados de structure_json (STORED) para evitar trazer JSONB na rede.
-- Índice composto para .eq(nutritionist_user_id).order(updated_at desc).

-- ---------------------------------------------------------------------------
-- Colunas geradas (atualizam automaticamente quando structure_json muda)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'diet_plans'
      AND column_name = 'list_meals_count'
  ) THEN
    ALTER TABLE public.diet_plans
      ADD COLUMN list_meals_count integer
      GENERATED ALWAYS AS (
        CASE
          WHEN jsonb_typeof(structure_json -> 'meals') = 'array'
          THEN jsonb_array_length(structure_json -> 'meals')
          ELSE 0
        END
      ) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'diet_plans'
      AND column_name = 'list_plan_version'
  ) THEN
    ALTER TABLE public.diet_plans
      ADD COLUMN list_plan_version integer
      GENERATED ALWAYS AS (
        GREATEST(
          1,
          LEAST(
            999999,
            CASE
              WHEN (structure_json ->> 'currentVersionNumber') ~ '^[0-9]+$'
              THEN (structure_json ->> 'currentVersionNumber')::integer
              ELSE 1
            END
          )
        )
      ) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'diet_plans'
      AND column_name = 'list_template_patient_count'
  ) THEN
    ALTER TABLE public.diet_plans
      ADD COLUMN list_template_patient_count integer
      GENERATED ALWAYS AS (
        CASE
          WHEN (structure_json ->> 'patientCount') ~ '^[0-9]+$'
          THEN LEAST(1000000, GREATEST(0, (structure_json ->> 'patientCount')::integer))
          ELSE 0
        END
      ) STORED;
  END IF;
END $$;

COMMENT ON COLUMN public.diet_plans.list_meals_count IS
  'Contagem de refeições (structure_json) para listagem sem carregar JSONB completo.';

COMMENT ON COLUMN public.diet_plans.list_plan_version IS
  'currentVersionNumber derivado de structure_json para listagem.';

COMMENT ON COLUMN public.diet_plans.list_template_patient_count IS
  'patientCount em modelos (structure_json) para listagem.';

-- ---------------------------------------------------------------------------
-- Índice: lista de planos por nutricionista ordenada por updated_at
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS diet_plans_nutritionist_updated_at_idx
  ON public.diet_plans (nutritionist_user_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Pacientes: diretório por nutri + ordenação recente (RLS já restringe ao user)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS patients_nutritionist_created_at_idx
  ON public.patients (nutritionist_user_id, created_at DESC);
