-- Perfis com role explícita + RLS clínica baseada em is_clinical_staff().
-- Autorização clínica deixa de depender apenas de "ter criado dados".

-- ---------------------------------------------------------------------------
-- 1) Tabela profiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'patient'
    CHECK (role IN ('patient', 'nutritionist', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Perfil da conta: autorização explícita. Cadastro público → patient; nutricionista por promoção controlada.';

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) Backfill (antes de RLS estrita em profiles)
-- ---------------------------------------------------------------------------

INSERT INTO public.profiles (id, role)
SELECT u.id, 'patient'::text
FROM auth.users AS u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles p
SET role = 'nutritionist',
    updated_at = now()
WHERE p.id IN (
  SELECT DISTINCT nutritionist_user_id
  FROM public.patients
  WHERE nutritionist_user_id IS NOT NULL
  UNION
  SELECT DISTINCT nutritionist_user_id
  FROM public.diet_plans
  WHERE nutritionist_user_id IS NOT NULL
);

-- ---------------------------------------------------------------------------
-- 3) Função: staff clínico (bypass RLS em profiles via SECURITY DEFINER)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_clinical_staff(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pr
    WHERE pr.id = p_uid
      AND pr.role IN ('nutritionist', 'admin')
  );
$$;

COMMENT ON FUNCTION public.is_clinical_staff(uuid) IS
  'True se o utilizador tem role nutritionist ou admin. Usado em RLS e RPCs clínicas.';

GRANT EXECUTE ON FUNCTION public.is_clinical_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinical_staff(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 4) RLS em profiles (leitura própria; escrita só via trigger/service)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5) Trigger: novos auth.users → profile patient
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'patient')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- ---------------------------------------------------------------------------
-- 6) patients: políticas nutricionista exigem staff clínico
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_select_own_patients" ON public.patients;
DROP POLICY IF EXISTS "nutritionist_insert_own_patients" ON public.patients;
DROP POLICY IF EXISTS "nutritionist_update_own_patients" ON public.patients;
DROP POLICY IF EXISTS "nutritionist_delete_own_patients" ON public.patients;

CREATE POLICY "nutritionist_select_own_patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  );

CREATE POLICY "nutritionist_insert_own_patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  );

CREATE POLICY "nutritionist_update_own_patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  )
  WITH CHECK (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  );

CREATE POLICY "nutritionist_delete_own_patients"
  ON public.patients FOR DELETE
  TO authenticated
  USING (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  );

-- patient_select_own_row: inalterado conceito (paciente lê a própria ficha)

-- ---------------------------------------------------------------------------
-- 7) diet_plans
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_all_own_diet_plans" ON public.diet_plans;

CREATE POLICY "nutritionist_all_own_diet_plans"
  ON public.diet_plans FOR ALL
  TO authenticated
  USING (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  )
  WITH CHECK (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  );

-- patient_select_published_plan: sem alteração

-- ---------------------------------------------------------------------------
-- 8) patient_adherence_logs — select nutricionista
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_adherence_select" ON public.patient_adherence_logs;

CREATE POLICY "nutritionist_adherence_select"
  ON public.patient_adherence_logs FOR SELECT
  TO authenticated
  USING (
    public.is_clinical_staff(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_adherence_logs.patient_id
        AND p.nutritionist_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 9) diet_plan_versions
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_versions_all" ON public.diet_plan_versions;

CREATE POLICY "nutritionist_versions_all"
  ON public.diet_plan_versions FOR ALL
  TO authenticated
  USING (
    public.is_clinical_staff(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_plan_versions.plan_id
        AND dp.nutritionist_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_clinical_staff(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.diet_plans dp
      WHERE dp.id = diet_plan_versions.plan_id
        AND dp.nutritionist_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 10) patient_plan_ack — select nutricionista
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_ack_select" ON public.patient_plan_ack;

CREATE POLICY "nutritionist_ack_select"
  ON public.patient_plan_ack FOR SELECT
  TO authenticated
  USING (
    public.is_clinical_staff(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_plan_ack.patient_id
        AND p.nutritionist_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 11) patient_shopping_lists
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_shopping_lists_all" ON public.patient_shopping_lists;

CREATE POLICY "nutritionist_shopping_lists_all"
  ON public.patient_shopping_lists FOR ALL
  TO authenticated
  USING (
    public.is_clinical_staff(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_shopping_lists.patient_id
        AND p.nutritionist_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_clinical_staff(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_shopping_lists.patient_id
        AND p.nutritionist_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 12) patient_assessments
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "nutritionist_all_own_patient_assessments" ON public.patient_assessments;

CREATE POLICY "nutritionist_all_own_patient_assessments"
  ON public.patient_assessments FOR ALL
  TO authenticated
  USING (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  )
  WITH CHECK (
    nutritionist_user_id = auth.uid()
    AND public.is_clinical_staff(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 13) RPC publish_diet_plan_for_patient — exige staff clínico
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

  IF NOT public.is_clinical_staff(uid) THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
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

-- ---------------------------------------------------------------------------
-- 14) foods: leitura apenas para staff clínico (construtor / área interna)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "foods_select_authenticated" ON public.foods;

CREATE POLICY "foods_select_authenticated"
  ON public.foods FOR SELECT
  TO authenticated
  USING (public.is_clinical_staff(auth.uid()));
