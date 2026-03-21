-- Adesão do paciente, histórico de versões do plano, reconhecimento de atualização pelo paciente

-- ---------------------------------------------------------------------------
-- patient_adherence_logs (uma linha por refeição/dia ou uma linha "daily" por dia)
-- ---------------------------------------------------------------------------

create table if not exists public.patient_adherence_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  plan_id uuid not null references public.diet_plans (id) on delete cascade,
  meal_id text,
  scope text not null default 'meal' check (scope in ('meal', 'daily')),
  log_date date not null,
  completed boolean not null default false,
  difficulty text not null default 'none',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_adherence_meal_id_check check (
    (scope = 'meal' and meal_id is not null) or (scope = 'daily' and meal_id is null)
  )
);

create unique index if not exists patient_adherence_meal_day_uidx
  on public.patient_adherence_logs (patient_id, plan_id, meal_id, log_date)
  where scope = 'meal';

create unique index if not exists patient_adherence_daily_uidx
  on public.patient_adherence_logs (patient_id, plan_id, log_date)
  where scope = 'daily';

create index if not exists patient_adherence_lookup_idx
  on public.patient_adherence_logs (patient_id, plan_id, log_date);

drop trigger if exists set_patient_adherence_updated_at on public.patient_adherence_logs;
create trigger set_patient_adherence_updated_at
  before update on public.patient_adherence_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- diet_plan_versions (append-only)
-- ---------------------------------------------------------------------------

create table if not exists public.diet_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.diet_plans (id) on delete cascade,
  structure_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists diet_plan_versions_plan_created_idx
  on public.diet_plan_versions (plan_id, created_at desc);

-- ---------------------------------------------------------------------------
-- patient_plan_ack (última vez que o paciente "viu" o plano nesta versão)
-- ---------------------------------------------------------------------------

create table if not exists public.patient_plan_ack (
  patient_id uuid not null references public.patients (id) on delete cascade,
  plan_id uuid not null references public.diet_plans (id) on delete cascade,
  last_acknowledged_at timestamptz not null default now(),
  primary key (patient_id, plan_id)
);

-- ---------------------------------------------------------------------------
-- RLS: adherence logs
-- ---------------------------------------------------------------------------

alter table public.patient_adherence_logs enable row level security;

drop policy if exists "patient_adherence_own_all" on public.patient_adherence_logs;
drop policy if exists "nutritionist_adherence_select" on public.patient_adherence_logs;

create policy "patient_adherence_own_all"
  on public.patient_adherence_logs for all
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_adherence_logs.patient_id
        and p.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_adherence_logs.patient_id
        and p.auth_user_id = auth.uid()
    )
  );

create policy "nutritionist_adherence_select"
  on public.patient_adherence_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_adherence_logs.patient_id
        and p.nutritionist_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: diet_plan_versions
-- ---------------------------------------------------------------------------

alter table public.diet_plan_versions enable row level security;

drop policy if exists "nutritionist_versions_all" on public.diet_plan_versions;
drop policy if exists "patient_versions_select_published" on public.diet_plan_versions;

create policy "nutritionist_versions_all"
  on public.diet_plan_versions for all
  to authenticated
  using (
    exists (
      select 1 from public.diet_plans dp
      where dp.id = diet_plan_versions.plan_id
        and dp.nutritionist_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.diet_plans dp
      where dp.id = diet_plan_versions.plan_id
        and dp.nutritionist_user_id = auth.uid()
    )
  );

create policy "patient_versions_select_published"
  on public.diet_plan_versions for select
  to authenticated
  using (
    exists (
      select 1 from public.diet_plans dp
      join public.patients p on p.id = dp.patient_id
      where dp.id = diet_plan_versions.plan_id
        and dp.status = 'published'
        and p.auth_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: patient_plan_ack
-- ---------------------------------------------------------------------------

alter table public.patient_plan_ack enable row level security;

drop policy if exists "patient_ack_own" on public.patient_plan_ack;
drop policy if exists "nutritionist_ack_select" on public.patient_plan_ack;

create policy "patient_ack_own"
  on public.patient_plan_ack for all
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_plan_ack.patient_id
        and p.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_plan_ack.patient_id
        and p.auth_user_id = auth.uid()
    )
  );

create policy "nutritionist_ack_select"
  on public.patient_plan_ack for select
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_plan_ack.patient_id
        and p.nutritionist_user_id = auth.uid()
    )
  );
