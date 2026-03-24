# Fase 3 — Execução controlada (cutover multi-clínica)

Esta fase está dividida em 3 etapas com rollback rápido.

## Pré-gate obrigatório (antes de ativar cutover)

```sql
SELECT * FROM public.v_workspace_cutover_readiness;
```

Critério: todos os contadores de inconsistência devem ser `0`.

## Etapa 3.1 — Shadow hardening

Migração:
- `20260331150000_workspace_phase3_1_shadow_hardening.sql`

Entregas:
- runtime flag DB `workspace_cutover` (default `false`);
- helpers v2 de autorização por clínica;
- policies `patients` com gate (`legacy` quando cutover off; `v2` quando on);
- constraints progressivas `NOT VALID`.

Rollback:
- manter `workspace_cutover=false`.

## Etapa 3.2 — Cutover por flag

Migração:
- `20260331152000_workspace_phase3_2_cutover_flag.sql`

Entregas:
- RPC operacional `set_workspace_cutover(boolean)`;
- policy admin de `professional_access_requests` com isolamento por clínica quando cutover on;
- app com flag `NEXT_PUBLIC_WORKSPACE_CUTOVER`.

Ativar cutover (DB):

```sql
SELECT public.set_workspace_cutover(true);
```

Ativar cutover (app):
- setar `NEXT_PUBLIC_WORKSPACE_CUTOVER=true`
- reiniciar app.

Rollback rápido:

```sql
SELECT public.set_workspace_cutover(false);
```

e no app:
- `NEXT_PUBLIC_WORKSPACE_CUTOVER=false`

## Etapa 3.3 — Consolidação

Migração:
- `20260331154000_workspace_phase3_3_consolidation_tools.sql`

Entregas:
- view de readiness final `v_workspace_cutover_readiness`;
- função `workspace_finalize_constraints()` que valida constraints somente se gate estiver limpo.

Executar:

```sql
SELECT public.workspace_finalize_constraints();
```

Se retornar `ok=false`, corrigir inconsistências e repetir.

## Checklist de validação funcional

1. **Isolamento entre clínicas**
   - usuário de clínica A não enxerga pacientes da clínica B.
2. **Papéis**
   - `clinic_admin`: vê todos os pacientes da clínica.
   - `nutritionist` com `own_only`: vê apenas primary/care_team.
3. **Fluxos críticos sem regressão**
   - login por intenção;
   - portal paciente (`/meu-plano`);
   - aprovação de acesso profissional;
   - lista de pacientes no dashboard.

## Queries rápidas de auditoria pós-cutover

```sql
SELECT * FROM public.v_workspace_cutover_readiness;
```

```sql
SELECT key, enabled, updated_at
FROM public.runtime_flags
WHERE key = 'workspace_cutover';
```

```sql
SELECT id, clinic_id, nutritionist_user_id
FROM public.patients
ORDER BY created_at DESC
LIMIT 20;
```
