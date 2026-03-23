-- Campos antropométricos básicos para o motor nutricional no builder.
alter table public.patients
  add column if not exists weight_kg numeric(6,2),
  add column if not exists height_cm numeric(6,2),
  add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'intense')),
  add column if not exists nutrition_goal text check (nutrition_goal in ('weight_loss', 'maintenance', 'muscle_gain'));

