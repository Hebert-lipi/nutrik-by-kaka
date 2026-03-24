-- Pedidos de acesso profissional: submissão por paciente, aprovação por staff clínico (sem SQL manual).

-- ---------------------------------------------------------------------------
-- 1) Tabela
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.professional_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  requester_email text NOT NULL DEFAULT '',
  full_name text NOT NULL,
  professional_registration text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.professional_access_requests IS
  'Pedido de upgrade para área clínica; aprovação explícita por nutritionist/admin via RPC.';

CREATE INDEX IF NOT EXISTS professional_access_requests_status_created_idx
  ON public.professional_access_requests (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS professional_access_requests_one_pending_per_user_idx
  ON public.professional_access_requests (user_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS set_professional_access_requests_updated_at ON public.professional_access_requests;
CREATE TRIGGER set_professional_access_requests_updated_at
  BEFORE UPDATE ON public.professional_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) RLS: leitura para autor ou staff; escrita só via RPC (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

ALTER TABLE public.professional_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professional_access_requests_select" ON public.professional_access_requests;
CREATE POLICY "professional_access_requests_select"
  ON public.professional_access_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_clinical_staff(auth.uid())
  );

-- Sem INSERT/UPDATE/DELETE para authenticated — apenas funções DEFINER

GRANT SELECT ON public.professional_access_requests TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) RPC: submeter pedido
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_professional_access_request(
  p_full_name text,
  p_professional_registration text DEFAULT '',
  p_message text DEFAULT ''
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

  INSERT INTO public.professional_access_requests (
    user_id,
    requester_email,
    full_name,
    professional_registration,
    message
  )
  VALUES (
    uid,
    coalesce(trim(em), ''),
    nm,
    trim(coalesce(p_professional_registration, '')),
    trim(coalesce(p_message, ''))
  );

  RETURN json_build_object('ok', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('ok', false, 'error', 'already_pending');
END;
$$;

REVOKE ALL ON FUNCTION public.submit_professional_access_request(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_professional_access_request(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) RPC: aprovar / recusar
-- ---------------------------------------------------------------------------

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
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF NOT public.is_clinical_staff(uid) THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT user_id, status INTO tgt, st
  FROM public.professional_access_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF tgt IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF st <> 'pending' THEN
    RETURN json_build_object('ok', false, 'error', 'already_processed');
  END IF;

  UPDATE public.professional_access_requests
  SET
    status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = uid,
    reviewed_at = now(),
    review_note = trim(coalesce(p_note, ''))
  WHERE id = p_request_id;

  IF p_approve THEN
    UPDATE public.profiles
    SET role = 'nutritionist',
        updated_at = now()
    WHERE id = tgt
      AND role = 'patient';
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.review_professional_access_request(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_professional_access_request(uuid, boolean, text) TO authenticated;
