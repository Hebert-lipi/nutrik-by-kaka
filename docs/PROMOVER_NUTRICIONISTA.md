# Promover conta a nutricionista (ou admin)

Contas criadas pelo login público (OTP) ficam com `role = patient` em `public.profiles`.  
**Fluxo recomendado no produto:** o próprio utilizador envia o pedido em **Solicitar acesso profissional** e um **nutritionist** ou **admin** aprova em **Painel → Acesso profissional** — sem SQL.

O SQL abaixo continua válido para **bootstrap**, recuperação ou políticas internas da clínica.

## 1. Obter o UUID do utilizador

No **Supabase Dashboard** → **Authentication** → **Users** → copiar o **User UID** do e-mail desejado.

Ou por SQL (SQL Editor):

```sql
SELECT id, email, created_at
FROM auth.users
WHERE lower(email) = lower('profissional@exemplo.com');
```

## 2. Promover a `nutritionist`

```sql
UPDATE public.profiles
SET role = 'nutritionist',
    updated_at = now()
WHERE id = '<UUID_COPIADO>';
```

Verificar:

```sql
SELECT id, role, updated_at
FROM public.profiles
WHERE id = '<UUID_COPIADO>';
```

## 3. Admin (opcional)

```sql
UPDATE public.profiles
SET role = 'admin',
    updated_at = now()
WHERE id = '<UUID_COPIADO>';
```

`admin` tem as mesmas permissões clínicas que `nutritionist` no código e RLS actuais; pode evoluir para gestão global.

## 4. Reverter para paciente (raro)

```sql
UPDATE public.profiles
SET role = 'patient',
    updated_at = now()
WHERE id = '<UUID_COPIADO>';
```

**Atenção:** se esta conta for dona de `patients` / `diet_plans` como nutricionista, os dados continuam no nome dela na BD; só perde a capacidade de os gerir pela app até ser promovida de novo.

## 5. Migração inicial

A migração `20260329100000_user_profiles_roles_rls.sql` já define `nutritionist` para todos os `auth.uid()` que aparecem como `nutritionist_user_id` em `patients` ou `diet_plans`, para não cortar acesso a contas existentes.
