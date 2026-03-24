# Etapa 2 — Como testar roles e acesso

Pré-requisito: aplicar a migração `20260329100000_user_profiles_roles_rls.sql` no projeto Supabase (`supabase db push` ou SQL Editor).

## Cenário A — Paciente

1. Conta com `profiles.role = patient` (padrão após OTP).
2. E-mail igual ao cadastrado na ficha → `claim_patient_by_email` vincula.
3. Esperado:
   - Abrir `/` ou após login → redireciona para **`/meu-plano`**.
   - Tentar `/dashboard`, `/patients`, `/diet-plans`, `/pdf/...` → redireciona para **`/meu-plano`**.
   - Na API: `insert` em `patients` / `diet_plans` → **erro RLS** (403 / policy).

## Cenário B — Nutricionista

1. Conta com `profiles.role = 'nutritionist'` (migração ou `UPDATE` manual — ver `PROMOVER_NUTRICIONISTA.md`).
2. Esperado:
   - Após login → **`/dashboard`**.
   - Acesso a pacientes, biblioteca, PDF de plano.
   - Criar paciente / plano → **sucesso** (com ownership `nutritionist_user_id = auth.uid()`).
3. Se **não** tiver `auth_user_id` em nenhuma ficha:
   - Aceder `/meu-plano` → redireciona para **`/dashboard`**.

## Cenário C — Nutricionista que também é paciente

1. `role = nutritionist` e existe `patients.auth_user_id = seu uid`.
2. Esperado:
   - Login → `/dashboard`.
   - Pode abrir **`/meu-plano`** e ver o plano publicado da própria ficha.

## Cenário D — Novo registo público (não promovido)

1. Novo e-mail, OTP, sem promoção.
2. `profiles.role` deve ser **`patient`** (trigger).
3. Não deve conseguir criar dados clínicos (RLS + UI redireciona para portal).

## Cenário E — RPC publicar plano

1. Como `patient`: chamar `publish_diet_plan_for_patient` → **`forbidden`** (ou falha antes por RLS).
2. Como `nutritionist` dono do plano: **sucesso** (`ok: true`).

## Cenário F — Base de alimentos (`foods`)

1. Como `patient`: `search_foods` / select em `foods` → **sem linhas** ou erro de política.
2. Como `nutritionist`: **dados** retornam normalmente no construtor.

## Checklist rápido

- [ ] Migração aplicada + `profiles` populada para utilizadores existentes.
- [ ] Trigger cria `profiles` para novo utilizador em `auth.users`.
- [ ] Paciente não entra no dashboard.
- [ ] Nutricionista entra no dashboard e não fica preso se não for paciente ao abrir `/meu-plano`.
- [ ] Publicação de plano só com role clínica.
