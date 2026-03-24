-- Aprovação / leitura da fila de pedidos de acesso profissional: apenas role `admin`.
-- Nutricionistas comuns não veem nem analisam pedidos (RLS + RPC).

DROP POLICY IF EXISTS "professional_access_requests_select" ON public.professional_access_requests;

CREATE POLICY "professional_access_requests_select_own"
  ON public.professional_access_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "professional_access_requests_select_admin"
  ON public.professional_access_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

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

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = uid AND pr.role = 'admin'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'admin_only');
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
