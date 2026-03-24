-- FASE 2 (dual-read / compatibilidade)
-- Objetivo: começar a usar contexto de clínica e novo modelo sem desligar legado.

-- ---------------------------------------------------------------------------
-- 1) Helpers de clínica ativa (com fallback seguro)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_active_clinic_id(
  p_preferred_clinic_id uuid DEFAULT NULL,
  p_uid uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic uuid;
BEGIN
  IF p_uid IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_preferred_clinic_id IS NOT NULL THEN
    SELECT cm.clinic_id
    INTO v_clinic
    FROM public.clinic_members cm
    WHERE cm.user_id = p_uid
      AND cm.clinic_id = p_preferred_clinic_id
      AND cm.member_status = 'active'::public.clinic_member_status
    LIMIT 1;
    IF v_clinic IS NOT NULL THEN
      RETURN v_clinic;
    END IF;
  END IF;

  SELECT cm.clinic_id
  INTO v_clinic
  FROM public.clinic_members cm
  WHERE cm.user_id = p_uid
    AND cm.member_status = 'active'::public.clinic_member_status
  ORDER BY cm.created_at ASC
  LIMIT 1;

  RETURN v_clinic;
END;
$$;

COMMENT ON FUNCTION public.resolve_active_clinic_id(uuid, uuid) IS
  'Resolve clínica ativa do usuário com preferência opcional e fallback ao primeiro membership ativo.';

GRANT EXECUTE ON FUNCTION public.resolve_active_clinic_id(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_active_clinic_id(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Aprovação profissional já escreve membership por clínica
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_professional_access_request(
  p_full_name text,
  p_professional_registration text DEFAULT '',
  p_message text DEFAULT '',
  p_target_clinic_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  r text;
  em text;
  nm text;
  v_target_clinic uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  nm := trim(coalesce(p_full_name, ''));
  IF length(nm) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_name');
  END IF;

  SELECT pr.role INTO r FROM public.profiles pr WHERE pr.id = uid;
  IF coalesce(r, 'patient') IN ('nutritionist', 'admin') THEN
    RETURN json_build_object('ok', false, 'error', 'already_professional');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.professional_access_requests x
    WHERE x.user_id = uid AND x.status = 'pending'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'already_pending');
  END IF;

  SELECT u.email::text INTO em FROM auth.users u WHERE u.id = uid;
  v_target_clinic := coalesce(p_target_clinic_id, public.resolve_active_clinic_id(NULL, uid));

  IF v_target_clinic IS NULL THEN
    SELECT c.id INTO v_target_clinic
    FROM public.clinics c
    WHERE c.slug = 'clinica-principal'
    LIMIT 1;
  END IF;

  INSERT INTO public.professional_access_requests (
    user_id,
    requester_email,
    full_name,
    professional_registration,
    message,
    target_clinic_id,
    requested_role
  )
  VALUES (
    uid,
    coalesce(trim(em), ''),
    nm,
    trim(coalesce(p_professional_registration, '')),
    trim(coalesce(p_message, '')),
    v_target_clinic,
    'nutritionist'::public.clinic_member_role
  );

  RETURN json_build_object('ok', true, 'target_clinic_id', v_target_clinic);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('ok', false, 'error', 'already_pending');
END;
$$;

REVOKE ALL ON FUNCTION public.submit_professional_access_request(text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_professional_access_request(text, text, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_professional_access_request(
  p_request_id uuid,
  p_approve boolean,
  p_note text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  tgt uuid;
  st text;
  v_target_clinic uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = uid AND pr.role = 'admin'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'admin_only');
  END IF;

  SELECT user_id, status, target_clinic_id
  INTO tgt, st, v_target_clinic
  FROM public.professional_access_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF tgt IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF st <> 'pending' THEN
    RETURN json_build_object('ok', false, 'error', 'already_processed');
  END IF;

  -- Compatibilidade: pedidos antigos podem não ter target_clinic_id.
  IF v_target_clinic IS NULL THEN
    SELECT c.id
    INTO v_target_clinic
    FROM public.clinics c
    WHERE c.slug = 'clinica-principal'
    LIMIT 1;
  END IF;

  UPDATE public.professional_access_requests
  SET
    status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = uid,
    reviewed_at = now(),
    review_note = trim(coalesce(p_note, '')),
    target_clinic_id = coalesce(target_clinic_id, v_target_clinic),
    requested_role = coalesce(requested_role, 'nutritionist'::public.clinic_member_role)
  WHERE id = p_request_id;

  IF p_approve THEN
    UPDATE public.profiles
    SET role = 'nutritionist',
        updated_at = now()
    WHERE id = tgt
      AND role = 'patient';

    IF v_target_clinic IS NOT NULL THEN
      INSERT INTO public.clinic_members (clinic_id, user_id, role, member_status)
      VALUES (
        v_target_clinic,
        tgt,
        'nutritionist'::public.clinic_member_role,
        'active'::public.clinic_member_status
      )
      ON CONFLICT (clinic_id, user_id) DO UPDATE
      SET
        role = EXCLUDED.role,
        member_status = 'active'::public.clinic_member_status,
        updated_at = now();
    END IF;
  END IF;

  RETURN json_build_object('ok', true, 'target_clinic_id', v_target_clinic);
END;
$$;
