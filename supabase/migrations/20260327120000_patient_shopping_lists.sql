-- Snapshot e revisão manual da lista de compras por plano publicado/revisão.

create table if not exists public.patient_shopping_lists (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  plan_id uuid not null references public.diet_plans (id) on delete cascade,
  plan_version integer not null default 1,
  plan_published_at timestamptz null,
  status text not null default 'draft' check (status in ('draft', 'reviewed')),
  items_json jsonb not null default '[]'::jsonb,
  quality_json jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, plan_id, plan_version)
);

create index if not exists patient_shopping_lists_patient_idx
  on public.patient_shopping_lists (patient_id, updated_at desc);

create index if not exists patient_shopping_lists_plan_idx
  on public.patient_shopping_lists (plan_id, plan_version desc);

drop trigger if exists set_patient_shopping_lists_updated_at on public.patient_shopping_lists;
create trigger set_patient_shopping_lists_updated_at
  before update on public.patient_shopping_lists
  for each row execute function public.set_updated_at();

alter table public.patient_shopping_lists enable row level security;

drop policy if exists "nutritionist_shopping_lists_all" on public.patient_shopping_lists;
drop policy if exists "patient_shopping_lists_select" on public.patient_shopping_lists;

create policy "nutritionist_shopping_lists_all"
  on public.patient_shopping_lists for all
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_shopping_lists.patient_id
        and p.nutritionist_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_shopping_lists.patient_id
        and p.nutritionist_user_id = auth.uid()
    )
  );

create policy "patient_shopping_lists_select"
  on public.patient_shopping_lists for select
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_shopping_lists.patient_id
        and p.auth_user_id = auth.uid()
        and p.portal_can_shopping is true
    )
  );
