# Auditoria — Fase 0 + Fase 1 (Workspace Clínico)

Migração relacionada: `supabase/migrations/20260331123000_clinic_workspace_phase0_phase1.sql`

Objetivo: validar que schema novo e backfill inicial foram aplicados sem quebrar o fluxo atual.

## 1) Check rápido (resumo)

```sql
SELECT * FROM public.v_workspace_backfill_audit;
```

Esperado:
- `main_clinic_id` preenchido.
- `patients_with_clinic_id = patients_total`.
- `access_requests_with_target_clinic = access_requests_total`.
- `clinic_members_total >= professionals_in_profiles`.

## 2) Inconsistências comuns

### Profissional em `profiles` sem membership

```sql
SELECT p.id, p.role
FROM public.profiles p
LEFT JOIN public.clinic_members cm
  ON cm.user_id = p.id
  AND cm.member_status = 'active'
WHERE p.role IN ('nutritionist', 'admin')
  AND cm.id IS NULL;
```

### Paciente sem `patient_clinic_links`

```sql
SELECT p.id, p.clinic_id, p.nutritionist_user_id
FROM public.patients p
LEFT JOIN public.patient_clinic_links pcl
  ON pcl.patient_id = p.id
WHERE pcl.id IS NULL;
```

### Pedidos sem `target_clinic_id`

```sql
SELECT id, user_id, status, created_at
FROM public.professional_access_requests
WHERE target_clinic_id IS NULL
ORDER BY created_at DESC;
```

### Responsável principal fora da clínica

```sql
SELECT
  pcl.patient_id,
  pcl.clinic_id,
  pcl.primary_nutritionist_user_id
FROM public.patient_clinic_links pcl
LEFT JOIN public.clinic_members cm
  ON cm.clinic_id = pcl.clinic_id
  AND cm.user_id = pcl.primary_nutritionist_user_id
  AND cm.member_status = 'active'
WHERE pcl.primary_nutritionist_user_id IS NOT NULL
  AND cm.id IS NULL;
```

## 3) Sanidade operacional (fluxo atual)

Após aplicar migração:
- login por intenção continua funcionando;
- portal paciente (`/meu-plano`) continua acessível para pacientes;
- dashboard clínico continua usando o modelo atual (ainda não cutover);
- aprovação de acesso profissional admin-only permanece ativa.

## 4) Correção manual emergencial (se necessário)

### Reforçar vínculo de profissional na clínica principal

```sql
INSERT INTO public.clinic_members (clinic_id, user_id, role, member_status)
SELECT
  c.id,
  p.id,
  CASE WHEN p.role = 'admin' THEN 'clinic_admin'::public.clinic_member_role
       ELSE 'nutritionist'::public.clinic_member_role END,
  'active'::public.clinic_member_status
FROM public.clinics c
JOIN public.profiles p ON p.role IN ('nutritionist', 'admin')
WHERE c.slug = 'clinica-principal'
ON CONFLICT (clinic_id, user_id) DO NOTHING;
```

### Reaplicar `target_clinic_id` nos pedidos

```sql
UPDATE public.professional_access_requests r
SET target_clinic_id = c.id
FROM public.clinics c
WHERE c.slug = 'clinica-principal'
  AND r.target_clinic_id IS NULL;
```
