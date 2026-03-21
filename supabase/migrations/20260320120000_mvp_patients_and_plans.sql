-- Nutrik MVP: pacientes, planos, RLS e vínculo paciente ↔ auth
-- Rode no SQL Editor do Supabase ou via CLI: supabase db push

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  notes text not null default '',
  auth_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists patients_nutritionist_email_lower_idx
  on public.patients (nutritionist_user_id, lower(email));

create index if not exists patients_auth_user_id_idx on public.patients (auth_user_id);

create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  nutritionist_user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete cascade,
  title text not null default '',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  structure_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diet_plans_nutritionist_idx on public.diet_plans (nutritionist_user_id);
create index if not exists diet_plans_patient_idx on public.diet_plans (patient_id);
create index if not exists diet_plans_published_patient_idx on public.diet_plans (patient_id, status)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists set_diet_plans_updated_at on public.diet_plans;
create trigger set_diet_plans_updated_at
  before update on public.diet_plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: vincular login do paciente ao cadastro (mesmo e-mail, 1 linha)
-- ---------------------------------------------------------------------------

create or replace function public.claim_patient_by_email()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  em text;
  n int;
begin
  uid := auth.uid();
  if uid is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select u.email::text into em from auth.users u where u.id = uid;
  if em is null or length(trim(em)) = 0 then
    return json_build_object('ok', false, 'error', 'no_email');
  end if;

  update public.patients p
  set auth_user_id = uid,
      updated_at = now()
  where p.id = (
    select p2.id
    from public.patients p2
    where p2.auth_user_id is null
      and lower(trim(p2.email)) = lower(trim(em))
    order by p2.created_at asc
    limit 1
  );

  get diagnostics n = row_count;
  return json_build_object('ok', true, 'linked', n > 0);
end;
$$;

grant execute on function public.claim_patient_by_email() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.patients enable row level security;
alter table public.diet_plans enable row level security;

drop policy if exists "nutritionist_select_own_patients" on public.patients;
drop policy if exists "nutritionist_insert_own_patients" on public.patients;
drop policy if exists "nutritionist_update_own_patients" on public.patients;
drop policy if exists "nutritionist_delete_own_patients" on public.patients;
drop policy if exists "patient_select_own_row" on public.patients;
drop policy if exists "nutritionist_all_own_diet_plans" on public.diet_plans;
drop policy if exists "patient_select_published_plan" on public.diet_plans;

-- Pacientes: nutricionista dono
create policy "nutritionist_select_own_patients"
  on public.patients for select
  to authenticated
  using (nutritionist_user_id = auth.uid());

create policy "nutritionist_insert_own_patients"
  on public.patients for insert
  to authenticated
  with check (nutritionist_user_id = auth.uid());

create policy "nutritionist_update_own_patients"
  on public.patients for update
  to authenticated
  using (nutritionist_user_id = auth.uid())
  with check (nutritionist_user_id = auth.uid());

create policy "nutritionist_delete_own_patients"
  on public.patients for delete
  to authenticated
  using (nutritionist_user_id = auth.uid());

-- Paciente lê a própria ficha (após claim)
create policy "patient_select_own_row"
  on public.patients for select
  to authenticated
  using (auth_user_id = auth.uid());

-- Planos: nutricionista dono
create policy "nutritionist_all_own_diet_plans"
  on public.diet_plans for all
  to authenticated
  using (nutritionist_user_id = auth.uid())
  with check (nutritionist_user_id = auth.uid());

-- Paciente: só leitura do plano publicado vinculado a ele
create policy "patient_select_published_plan"
  on public.diet_plans for select
  to authenticated
  using (
    status = 'published'
    and patient_id is not null
    and exists (
      select 1 from public.patients p
      where p.id = diet_plans.patient_id
        and p.auth_user_id = auth.uid()
    )
  );
