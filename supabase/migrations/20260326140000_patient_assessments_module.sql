-- Módulo clínico de avaliações/evolução do paciente.
create table if not exists public.patient_assessments (
  id uuid primary key default gen_random_uuid(),
  nutritionist_user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  assessment_date date not null,

  -- Básico e circunferências
  weight_kg numeric(6,2),
  height_cm numeric(6,2),
  waist_cm numeric(6,2),
  hip_cm numeric(6,2),
  abdomen_cm numeric(6,2),
  chest_cm numeric(6,2),
  arm_cm numeric(6,2),
  thigh_cm numeric(6,2),
  calf_cm numeric(6,2),

  -- Dobras (mm)
  triceps_mm numeric(6,2),
  biceps_mm numeric(6,2),
  subscapular_mm numeric(6,2),
  suprailiac_mm numeric(6,2),
  abdominal_mm numeric(6,2),
  chest_skinfold_mm numeric(6,2),
  midaxillary_mm numeric(6,2),
  thigh_skinfold_mm numeric(6,2),
  calf_skinfold_mm numeric(6,2),

  -- Snapshot clínico (evita retroatividade)
  sex_at_assessment text check (sex_at_assessment in ('female','male','other','unspecified')),
  age_at_assessment integer,
  activity_level_snapshot text check (activity_level_snapshot in ('sedentary','light','moderate','intense')),
  goal_snapshot text check (goal_snapshot in ('weight_loss','maintenance','muscle_gain')),

  -- Composição corporal
  body_formula text check (body_formula in ('jackson_pollock_3','jackson_pollock_7','durnin_womersley','slaughter','petroski')),
  body_density numeric(8,5),
  body_fat_pct numeric(6,2),
  fat_mass_kg numeric(6,2),
  lean_mass_kg numeric(6,2),

  -- Contexto futuro (plano vigente no período)
  plan_id_snapshot uuid references public.diet_plans (id) on delete set null,
  plan_title_snapshot text,

  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patient_assessments_patient_date_idx
  on public.patient_assessments (patient_id, assessment_date desc, created_at desc);
create index if not exists patient_assessments_owner_idx
  on public.patient_assessments (nutritionist_user_id);

drop trigger if exists set_patient_assessments_updated_at on public.patient_assessments;
create trigger set_patient_assessments_updated_at
  before update on public.patient_assessments
  for each row execute function public.set_updated_at();

alter table public.patient_assessments enable row level security;

drop policy if exists "nutritionist_all_own_patient_assessments" on public.patient_assessments;
create policy "nutritionist_all_own_patient_assessments"
  on public.patient_assessments for all
  to authenticated
  using (nutritionist_user_id = auth.uid())
  with check (nutritionist_user_id = auth.uid());

