-- Alinha `is_clinical_staff()` com o gate do middleware quando há workspace:
-- utilizador com `clinic_members` ativo deve poder gravar em `diet_plans`, mesmo que
-- `profiles.role` ainda esteja desatualizado (ex.: migração parcial).

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
  )
  OR EXISTS (
    SELECT 1
    FROM public.clinic_members cm
    WHERE cm.user_id = p_uid
      AND cm.member_status = 'active'
      AND cm.role IN (
        'nutritionist'::public.clinic_member_role,
        'clinic_admin'::public.clinic_member_role
      )
  );
$$;

COMMENT ON FUNCTION public.is_clinical_staff(uuid) IS
  'True se nutritionist/admin em profiles OU membro ativo de clínica (nutritionist/clinic_admin). Usado em RLS.';
