-- FASE 0 + FASE 1 (workspace de clínica)
-- Objetivo: criar base multi-clínica e fazer backfill inicial sem quebrar fluxos atuais.
-- Estratégia: mudanças aditivas, colunas nullable, sem substituir autorização existente.

-- ---------------------------------------------------------------------------
-- 0) Tipos e tabelas base de clínica
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_member_role') THEN
    CREATE TYPE public.clinic_member_role AS ENUM ('clinic_admin', 'nutritionist');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_member_status') THEN
    CREATE TYPE public.clinic_member_status AS ENUM ('active', 'invited', 'suspended');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_clinic_link_status') THEN
    CREATE TYPE public.patient_clinic_link_status AS ENUM ('active', 'inactive');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'care_team_access_level') THEN
    CREATE TYPE public.care_team_access_level AS ENUM ('read', 'write');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_visibility_mode') THEN
    CREATE TYPE public.clinic_visibility_mode AS ENUM ('own_only', 'clinic_shared');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clinics IS
  'Workspace de clínica. Entidade central para isolamento multi-clínica.';

DROP TRIGGER IF EXISTS set_clinics_updated_at ON public.clinics;
CREATE TRIGGER set_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.clinic_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.clinic_member_role NOT NULL,
  member_status public.clinic_member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, user_id)
);

COMMENT ON TABLE public.clinic_members IS
  'Membros profissionais por clínica. Permite usuário em múltiplas clínicas.';

DROP TRIGGER IF EXISTS set_clinic_members_updated_at ON public.clinic_members;
CREATE TRIGGER set_clinic_members_updated_at
  BEFORE UPDATE ON public.clinic_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS clinic_members_user_status_idx
  ON public.clinic_members (user_id, member_status);

CREATE INDEX IF NOT EXISTS clinic_members_clinic_role_status_idx
  ON public.clinic_members (clinic_id, role, member_status);

CREATE TABLE IF NOT EXISTS public.patient_clinic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics (id) ON DELETE CASCADE,
  primary_nutritionist_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  status public.patient_clinic_link_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id)
);

COMMENT ON TABLE public.patient_clinic_links IS
  'Vínculo canônico paciente->clínica (fase atual: 1 clínica por paciente).';

DROP TRIGGER IF EXISTS set_patient_clinic_links_updated_at ON public.patient_clinic_links;
CREATE TRIGGER set_patient_clinic_links_updated_at
  BEFORE UPDATE ON public.patient_clinic_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS patient_clinic_links_clinic_status_idx
  ON public.patient_clinic_links (clinic_id, status);

CREATE INDEX IF NOT EXISTS patient_clinic_links_primary_nutritionist_idx
  ON public.patient_clinic_links (primary_nutritionist_user_id, status);

CREATE TABLE IF NOT EXISTS public.patient_care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics (id) ON DELETE CASCADE,
  nutritionist_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  access_level public.care_team_access_level NOT NULL DEFAULT 'write',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, nutritionist_user_id)
);

COMMENT ON TABLE public.patient_care_team IS
  'Equipe clínica adicional por paciente. Na fase inicial, inclui o responsável principal.';

CREATE INDEX IF NOT EXISTS patient_care_team_clinic_nutritionist_idx
  ON public.patient_care_team (clinic_id, nutritionist_user_id);

CREATE INDEX IF NOT EXISTS patient_care_team_patient_idx
  ON public.patient_care_team (patient_id);

CREATE TABLE IF NOT EXISTS public.clinic_settings (
  clinic_id uuid PRIMARY KEY REFERENCES public.clinics (id) ON DELETE CASCADE,
  nutritionist_visibility_mode public.clinic_visibility_mode NOT NULL DEFAULT 'own_only',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clinic_settings IS
  'Configurações por clínica (fase atual: visibilidade own_only).';

DROP TRIGGER IF EXISTS set_clinic_settings_updated_at ON public.clinic_settings;
CREATE TRIGGER set_clinic_settings_updated_at
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 0) Colunas novas (nullable) para compatibilidade
-- ---------------------------------------------------------------------------

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS patients_clinic_id_idx
  ON public.patients (clinic_id);

ALTER TABLE public.professional_access_requests
  ADD COLUMN IF NOT EXISTS target_clinic_id uuid REFERENCES public.clinics (id) ON DELETE SET NULL;

ALTER TABLE public.professional_access_requests
  ADD COLUMN IF NOT EXISTS requested_role public.clinic_member_role;

UPDATE public.professional_access_requests
SET requested_role = 'nutritionist'::public.clinic_member_role
WHERE requested_role IS NULL;

ALTER TABLE public.professional_access_requests
  ALTER COLUMN requested_role SET DEFAULT 'nutritionist'::public.clinic_member_role;

CREATE INDEX IF NOT EXISTS professional_access_requests_target_status_idx
  ON public.professional_access_requests (target_clinic_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 0) Helper functions (futuras fases, sem alterar autorização atual)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_clinic_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.clinic_id
  FROM public.clinic_members cm
  WHERE cm.user_id = auth.uid()
    AND cm.member_status = 'active'::public.clinic_member_status;
$$;

COMMENT ON FUNCTION public.current_user_clinic_ids() IS
  'Retorna clínicas ativas do usuário autenticado. Base para RLS multi-clínica.';

GRANT EXECUTE ON FUNCTION public.current_user_clinic_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_clinic_ids() TO service_role;

CREATE OR REPLACE FUNCTION public.is_clinic_admin(p_clinic_id uuid, p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinic_members cm
    WHERE cm.clinic_id = p_clinic_id
      AND cm.user_id = p_uid
      AND cm.role = 'clinic_admin'::public.clinic_member_role
      AND cm.member_status = 'active'::public.clinic_member_status
  );
$$;

COMMENT ON FUNCTION public.is_clinic_admin(uuid, uuid) IS
  'True se o usuário informado (ou auth.uid) é clinic_admin ativo da clínica.';

GRANT EXECUTE ON FUNCTION public.is_clinic_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinic_admin(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 1) Backfill inicial (clínica principal + membros + pacientes + pedidos)
-- ---------------------------------------------------------------------------

INSERT INTO public.clinics (name, slug, status)
VALUES ('Clínica Principal', 'clinica-principal', 'active')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO public.clinic_settings (clinic_id, nutritionist_visibility_mode)
SELECT c.id, 'own_only'::public.clinic_visibility_mode
FROM public.clinics c
WHERE c.slug = 'clinica-principal'
ON CONFLICT (clinic_id) DO NOTHING;

INSERT INTO public.clinic_members (clinic_id, user_id, role, member_status)
SELECT
  c.id AS clinic_id,
  p.id AS user_id,
  CASE
    WHEN p.role = 'admin' THEN 'clinic_admin'::public.clinic_member_role
    ELSE 'nutritionist'::public.clinic_member_role
  END AS role,
  'active'::public.clinic_member_status AS member_status
FROM public.clinics c
JOIN public.profiles p ON p.role IN ('nutritionist', 'admin')
WHERE c.slug = 'clinica-principal'
ON CONFLICT (clinic_id, user_id) DO UPDATE
SET
  role = EXCLUDED.role,
  member_status = 'active'::public.clinic_member_status,
  updated_at = now();

UPDATE public.patients p
SET clinic_id = c.id
FROM public.clinics c
WHERE c.slug = 'clinica-principal'
  AND p.clinic_id IS NULL;

INSERT INTO public.patient_clinic_links (
  patient_id,
  clinic_id,
  primary_nutritionist_user_id,
  status
)
SELECT
  p.id AS patient_id,
  p.clinic_id,
  p.nutritionist_user_id AS primary_nutritionist_user_id,
  'active'::public.patient_clinic_link_status AS status
FROM public.patients p
WHERE p.clinic_id IS NOT NULL
ON CONFLICT (patient_id) DO UPDATE
SET
  clinic_id = EXCLUDED.clinic_id,
  primary_nutritionist_user_id = EXCLUDED.primary_nutritionist_user_id,
  status = 'active'::public.patient_clinic_link_status,
  updated_at = now();

INSERT INTO public.patient_care_team (
  patient_id,
  clinic_id,
  nutritionist_user_id,
  access_level
)
SELECT
  p.id AS patient_id,
  p.clinic_id,
  p.nutritionist_user_id,
  'write'::public.care_team_access_level AS access_level
FROM public.patients p
WHERE p.clinic_id IS NOT NULL
  AND p.nutritionist_user_id IS NOT NULL
ON CONFLICT (patient_id, nutritionist_user_id) DO NOTHING;

UPDATE public.professional_access_requests r
SET target_clinic_id = c.id
FROM public.clinics c
WHERE c.slug = 'clinica-principal'
  AND r.target_clinic_id IS NULL;

-- ---------------------------------------------------------------------------
-- 1) Auditoria pós-backfill (visão rápida no SQL Editor)
-- ---------------------------------------------------------------------------
-- SELECT * FROM public.v_workspace_backfill_audit;

CREATE OR REPLACE VIEW public.v_workspace_backfill_audit AS
SELECT
  (SELECT id FROM public.clinics WHERE slug = 'clinica-principal') AS main_clinic_id,
  (SELECT COUNT(*) FROM public.clinics) AS clinics_total,
  (SELECT COUNT(*) FROM public.clinic_members) AS clinic_members_total,
  (SELECT COUNT(*) FROM public.profiles WHERE role IN ('nutritionist', 'admin')) AS professionals_in_profiles,
  (SELECT COUNT(*) FROM public.patients) AS patients_total,
  (SELECT COUNT(*) FROM public.patients WHERE clinic_id IS NOT NULL) AS patients_with_clinic_id,
  (SELECT COUNT(*) FROM public.patient_clinic_links) AS patient_clinic_links_total,
  (SELECT COUNT(*) FROM public.patients p WHERE p.nutritionist_user_id IS NOT NULL) AS patients_with_primary_nutritionist,
  (SELECT COUNT(*) FROM public.patient_care_team) AS patient_care_team_total,
  (SELECT COUNT(*) FROM public.professional_access_requests) AS access_requests_total,
  (SELECT COUNT(*) FROM public.professional_access_requests WHERE target_clinic_id IS NOT NULL) AS access_requests_with_target_clinic;
