-- Base de alimentos + busca por nome (autocomplete)
-- Valores nutricionais de referência por 100 g (coluna unit = '100g').

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories numeric not null default 0 check (calories >= 0),
  protein numeric not null default 0 check (protein >= 0),
  carbs numeric not null default 0 check (carbs >= 0),
  fat numeric not null default 0 check (fat >= 0),
  unit text not null default '100g',
  created_at timestamptz not null default now()
);

create index if not exists foods_name_lower_idx on public.foods (lower(name));

alter table public.foods enable row level security;

drop policy if exists "foods_select_authenticated" on public.foods;
create policy "foods_select_authenticated"
  on public.foods for select
  to authenticated
  using (true);

-- Busca por nome (ILIKE). Se query vazia, lista amostra ordenada (útil ao focar o campo).
create or replace function public.search_foods(search_query text, result_limit int default 20)
returns setof public.foods
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.foods
  where coalesce(trim(search_query), '') = ''
     or name ilike '%' || trim(search_query) || '%'
  order by
    case
      when coalesce(trim(search_query), '') = '' then 0
      when lower(name) = lower(trim(search_query)) then 1
      when lower(name) like lower(trim(search_query)) || '%' then 2
      else 3
    end,
    name asc
  limit least(coalesce(nullif(result_limit, 0), 20), 50);
$$;

grant execute on function public.search_foods(text, int) to authenticated;

-- Amostra inicial (referência aproximada / 100 g salvo quando aplicável)
insert into public.foods (name, calories, protein, carbs, fat, unit) values
  ('Arroz branco cozido', 128, 2.5, 28, 0.2, '100g'),
  ('Feijão preto cozido', 77, 4.5, 14, 0.5, '100g'),
  ('Frango grelhado (peito sem pele)', 159, 32, 0, 3.2, '100g'),
  ('Ovo de galinha cozido', 155, 13, 1.1, 11, '100g'),
  ('Pão francês', 300, 8, 58, 3.1, '100g'),
  ('Pão integral', 247, 9.2, 43, 3.4, '100g'),
  ('Banana prata', 98, 1.3, 26, 0.1, '100g'),
  ('Maçã com casca', 52, 0.3, 14, 0.2, '100g'),
  ('Aveia em flocos', 394, 13.9, 66.6, 7.4, '100g'),
  ('Leite desnatado', 35, 3.5, 5, 0.1, '100g'),
  ('Iogurte natural desnatado', 41, 3.8, 5.9, 0.1, '100g'),
  ('Queijo minas frescal', 264, 17.4, 3.2, 20.2, '100g'),
  ('Requeijão light', 200, 9, 8, 15, '100g'),
  ('Batata doce cozida', 86, 1.6, 20, 0.1, '100g'),
  ('Batata inglesa cozida', 52, 1.4, 12, 0.1, '100g'),
  ('Brócolis cozido', 35, 2.8, 7.2, 0.4, '100g'),
  ('Tomate cru', 18, 0.9, 3.9, 0.2, '100g'),
  ('Azeite de oliva', 884, 0, 0, 100, '100g'),
  ('Tapioca (goma hidratada)', 360, 0.2, 88, 0.2, '100g'),
  ('Carne bovina patinho grelhado', 219, 31, 0, 10, '100g'),
  ('Atum em água (escorrido)', 116, 26, 0, 0.8, '100g'),
  ('Castanha de caju', 553, 18.2, 30.2, 43.9, '100g'),
  ('Amendoim torrado', 606, 25.8, 16.2, 52.8, '100g');
