# Fase 2 — Dual-read / Compatibilidade (Workspace)

Esta fase começa a usar o modelo de clínica em leitura/escrita, sem desligar legado.

## Feature flag

- Flag: `NEXT_PUBLIC_WORKSPACE_DUAL_READ`
- Valores ativos: `1`, `true`, `yes`, `on`
- Com flag desligada: sistema segue comportamento legado.

## Implementado

1. **Contexto de clínica ativa**
   - Cookie: `nutrik_active_clinic_id`
   - Helper SQL: `resolve_active_clinic_id(p_preferred_clinic_id, p_uid)`
   - Helper client: `resolveActiveClinicId()`

2. **Dual-read em pacientes (camada app)**
   - `useSupabasePatients` passa a preferir filtro por `clinic_id` quando flag ligada.
   - Fallback automático para query legada caso clínica ativa não resolva.

3. **Aprovação de acesso profissional (write no novo modelo)**
   - `review_professional_access_request` agora faz upsert em `clinic_members` ao aprovar.
   - Mantém update em `profiles.role` para compatibilidade.

4. **Submissão de pedido de acesso**
   - `submit_professional_access_request` aceita `p_target_clinic_id`.
   - Se não vier, resolve clínica ativa ou fallback para `clinica-principal`.

## Teste manual rápido

## A) Flag desligada

1. Remover/zerar `NEXT_PUBLIC_WORKSPACE_DUAL_READ`.
2. Login e uso de pacientes/portal/dashboard devem continuar como antes.

## B) Flag ligada

1. Definir `NEXT_PUBLIC_WORKSPACE_DUAL_READ=true`.
2. Login como profissional -> cookie de clínica ativa deve ser definido.
3. Lista de pacientes continua carregando (agora preferindo `clinic_id`).
4. Aprovar pedido pendente em `/dashboard/solicitacoes-acesso`.
5. Validar membership criado:

```sql
SELECT cm.*
FROM public.clinic_members cm
JOIN public.professional_access_requests r
  ON r.user_id = cm.user_id
WHERE r.status = 'approved'
ORDER BY cm.created_at DESC
LIMIT 20;
```

## C) Fallback

Se houver problema com dual-read, desligar flag e revalidar fluxo.

## Auditoria complementar

```sql
SELECT * FROM public.v_workspace_backfill_audit;
```

```sql
SELECT id, status, target_clinic_id, reviewed_by, reviewed_at
FROM public.professional_access_requests
ORDER BY created_at DESC
LIMIT 20;
```
