-- Perfil estendido + permissões de portal (sem quebrar linhas existentes — colunas com default)

alter table public.patients
  add column if not exists phone text not null default '';

alter table public.patients
  add column if not exists birth_date date;

alter table public.patients
  add column if not exists sex text;

alter table public.patients
  add column if not exists portal_access_active boolean not null default true;

alter table public.patients
  add column if not exists portal_can_diet_plan boolean not null default true;

alter table public.patients
  add column if not exists portal_can_recipes boolean not null default true;

alter table public.patients
  add column if not exists portal_can_materials boolean not null default true;

alter table public.patients
  add column if not exists portal_can_shopping boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'patients_sex_check'
  ) then
    alter table public.patients
      add constraint patients_sex_check
      check (sex is null or sex in ('female', 'male', 'other', 'unspecified'));
  end if;
end $$;

comment on column public.patients.phone is 'Telefone / WhatsApp';
comment on column public.patients.birth_date is 'Data de nascimento';
comment on column public.patients.sex is 'Sexo biológico / identificação clínica (opcional)';
comment on column public.patients.portal_access_active is 'Acesso geral ao app do paciente';
comment on column public.patients.portal_can_diet_plan is 'Paciente pode ver plano alimentar no portal';
comment on column public.patients.portal_can_recipes is 'Paciente pode ver receitas (futuro)';
comment on column public.patients.portal_can_materials is 'Paciente pode ver materiais (futuro)';
comment on column public.patients.portal_can_shopping is 'Paciente pode ver lista de compras (futuro)';
