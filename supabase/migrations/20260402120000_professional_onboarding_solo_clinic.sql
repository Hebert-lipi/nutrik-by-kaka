-- Onboarding profissional persistido em profiles (não depende de cookie para autorização).
-- Modo solo: clínica pessoal por utilizador (slug estável), sem "clinica-principal".

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_professional_choice text
  NULL
  CHECK (onboarding_professional_choice IS NULL OR onboarding_professional_choice = 'clinic');

COMMENT ON COLUMN public.profiles.onboarding_professional_choice IS
  'Escolha persistida no servidor: fluxo com aprovação de clínica. Usado só para rotas de UX; RLS continua a mandar.';

-- ---------------------------------------------------------------------------
-- claim_solo_nutritionist_access (idempotente, clínica pessoal)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_solo_nutritionist_access()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_role text;
  v_clinic_id uuid;
  v_slug text;
  v_name text;
  v_label text;
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT pr.role INTO v_role
  FROM public.profiles pr
  WHERE pr.id = uid;

  IF v_role IS NULL THEN
    INSERT INTO public.profiles (id, role)
    VALUES (uid, 'patient')
    ON CONFLICT (id) DO NOTHING;
    SELECT pr.role INTO v_role FROM public.profiles pr WHERE pr.id = uid;
  END IF;

  IF v_role IN ('nutritionist', 'admin') THEN
    RETURN json_build_object('ok', true, 'already', true);
  END IF;

  IF v_role IS DISTINCT FROM 'patient' THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_role_state');
  END IF;

  v_slug := 'personal-' || replace(uid::text, '-', '');

  SELECT c.id INTO v_clinic_id
  FROM public.clinics c
  WHERE c.slug = v_slug
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    SELECT COALESCE(
      NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
      NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
      NULLIF(trim(split_part(u.email, '@', 1)), ''),
      'Profissional'
    )
    INTO v_label
    FROM auth.users u
    WHERE u.id = uid;

    IF v_label IS NULL THEN
      v_label := 'Profissional';
    END IF;

    v_name := 'Clínica de ' || v_label;

    INSERT INTO public.clinics (name, slug, status)
    VALUES (v_name, v_slug, 'active')
    ON CONFLICT (slug) DO NOTHING;

    SELECT c.id INTO v_clinic_id
    FROM public.clinics c
    WHERE c.slug = v_slug
    LIMIT 1;
  END IF;

  IF v_clinic_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'clinic_create_failed');
  END IF;

  INSERT INTO public.clinic_members (clinic_id, user_id, role, member_status)
  VALUES (
    v_clinic_id,
    uid,
    'nutritionist'::public.clinic_member_role,
    'active'::public.clinic_member_status
  )
  ON CONFLICT (clinic_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    member_status = 'active'::public.clinic_member_status,
    updated_at = now();

  UPDATE public.profiles
  SET
    role = 'nutritionist',
    onboarding_professional_choice = NULL
  WHERE id = uid
    AND role = 'patient';

  IF NOT FOUND THEN
    SELECT pr.role INTO v_role FROM public.profiles pr WHERE pr.id = uid;
    IF v_role IN ('nutritionist', 'admin') THEN
      RETURN json_build_object('ok', true, 'already', true);
    END IF;
    RETURN json_build_object('ok', false, 'error', 'promote_failed');
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_solo_nutritionist_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_solo_nutritionist_access() TO authenticated;

COMMENT ON FUNCTION public.claim_solo_nutritionist_access() IS
  'Idempotente: promove a nutritionist com workspace clínico pessoal (slug personal-<uuid>).';

-- ---------------------------------------------------------------------------
-- Escolha "clínica" persistida (middleware / gates)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_professional_clinic_flow()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_role text;
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT pr.role INTO v_role FROM public.profiles pr WHERE pr.id = uid;

  IF v_role IS NULL THEN
    INSERT INTO public.profiles (id, role)
    VALUES (uid, 'patient')
    ON CONFLICT (id) DO NOTHING;
    SELECT pr.role INTO v_role FROM public.profiles pr WHERE pr.id = uid;
  END IF;

  IF v_role IN ('nutritionist', 'admin') THEN
    RETURN json_build_object('ok', false, 'error', 'already_clinical');
  END IF;

  UPDATE public.profiles
  SET onboarding_professional_choice = 'clinic'
  WHERE id = uid;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_professional_clinic_flow() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_professional_clinic_flow() TO authenticated;

CREATE OR REPLACE FUNCTION public.clear_professional_onboarding_choice()
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

  UPDATE public.profiles
  SET onboarding_professional_choice = NULL
  WHERE id = uid;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.clear_professional_onboarding_choice() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_professional_onboarding_choice() TO authenticated;
