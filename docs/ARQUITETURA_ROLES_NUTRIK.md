# Etapa 1 — Arquitetura: roles explícitos e acesso clínico

## 1. Modelo de roles

| Role | Significado | Acesso |
|------|-------------|--------|
| `patient` | Utilizador padrão (cadastro público / OTP) | Apenas portal: `/meu-plano` e rotas de paciente necessárias ao fluxo do plano. |
| `nutritionist` | Profissional autorizado pela clínica | Área clínica: `/dashboard`, `/patients`, `/diet-plans`, `/pdf/...`, etc. |
| `admin` | Operador interno (futuro) | Mesmo conjunto de permissões clínicas que `nutritionist` no backend e middleware; pode evoluir para painel administrativo. |

**Um utilizador = uma linha em `profiles` = um `role` único.**  
Quem é nutricionista e também tem ficha como paciente continua com `role = nutritionist` (ou `admin`); o portal usa o vínculo `patients.auth_user_id` (já existente), não um segundo role.

## 2. Tabela e campo

- **`public.profiles`**
  - `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
  - `role text NOT NULL CHECK (role IN ('patient','nutritionist','admin')) DEFAULT 'patient'`
  - `created_at`, `updated_at`

**Fonte oficial de autorização clínica:** `profiles.role IN ('nutritionist', 'admin')`.  
**Não** usar contagem de `patients` / `diet_plans` como critério principal (mantemos ownership nas políticas, mas o “pode atuar como clínica” vem do role).

## 3. Função auxiliar (RLS)

- **`public.is_clinical_staff(p_uid uuid) RETURNS boolean`**
  - `SECURITY DEFINER`, `STABLE`, `search_path = public`
  - Lê `profiles` sem depender de RLS do cliente
  - Usada em todas as políticas de escrita/leitura “lado nutricionista”

## 4. Fluxo de criação de conta

### Paciente / cadastro público (atual)

1. OTP com `shouldCreateUser: true` → novo registo em `auth.users`.
2. **Trigger `on_auth_user_created`** → `INSERT INTO profiles (id, role) VALUES (NEW.id, 'patient')`.
3. Utilizador **não** é staff clínico → RLS bloqueia criar pacientes/planos mesmo que alguém tente contornar a UI.

### Nutricionista (controlado)

**Opção adoptada (simples e segura para a stack actual):**

- Promoção **manual** por SQL no Supabase (equipa interna / clínica), após verificação de identidade e contrato:

```sql
UPDATE public.profiles
SET role = 'nutritionist', updated_at = now()
WHERE id = '<uuid-do-auth.users>';
```

- **Migração inicial:** todos os `auth.uid()` que já são donos de linhas em `patients` ou `diet_plans` (`nutritionist_user_id`) recebem `role = 'nutritionist'` automaticamente, para não quebrar contas existentes.

**Futuro (sem obrigatoriedade agora):** tabela `nutritionist_invites`, Edge Function, ou painel admin que chame RPC `SECURITY DEFINER` validada.

## 5. Fluxo do paciente (inalterado conceptualmente)

1. `claim_patient_by_email` continua a vincular `auth_user_id` quando o e-mail coincide com a ficha.
2. Middleware: sem role clínico → não entra em rotas internas; redireciona para `/meu-plano`.
3. RLS de leitura do plano publicado e adesão mantém políticas “paciente” existentes.

## 6. Utilizador com “dois mundos” (consciente)

- **Role `nutritionist` ou `admin` + `auth_user_id` na ficha:** acede à área clínica **e** a `/meu-plano` (próprio plano publicado).
- **Landing após login:** `/dashboard` se `isClinicalStaff(role)`; caso contrário `/meu-plano`.
- **Regra extra:** quem é só staff **sem** vínculo paciente continua a ser redireccionado de `/meu-plano` para o dashboard (evita ecrã vazio).

## 7. Impacto no sistema actual

| Área | Impacto |
|------|---------|
| Middleware | Usa `role` em vez de contagens para rotas clínicas vs portal. |
| `getUserContext` | Lê `profiles`; `isNutritionist` passa a derivar do role; `isPatient` mantém-se pelo `auth_user_id`. |
| RLS | Políticas “nutritionist_*” ganham `AND is_clinical_staff(auth.uid())`. |
| RPC `publish_diet_plan_for_patient` | Verifica `is_clinical_staff` antes de alterar dados. |
| Novos signups | Passam a `patient` por defeito; não criam dados clínicos sem promoção. |

## 8. Plano de migração seguro

1. Criar `profiles` + função + RLS da tabela.
2. Backfill: `INSERT ... SELECT id FROM auth.users` com `role = 'patient'`.
3. `UPDATE` para `nutritionist` onde `id` aparece como `nutritionist_user_id` em `patients` ou `diet_plans`.
4. Criar trigger em `auth.users` para novos utilizadores.
5. Substituir políticas RLS e corpo da RPC de publicação.
6. Deploy da app com `user-context` + `middleware` actualizados.

**Rollback:** reverter deploy da app e, se necessário, restaurar políticas antigas a partir de backup/migração inversa (documentar no repositório).

---

## Etapa 2 (implementado no repositório)

- **Migration:** `supabase/migrations/20260329100000_user_profiles_roles_rls.sql`
- **App:** `src/lib/auth/user-context.ts`, `src/middleware.ts`
- **Testes manuais:** `docs/ETAPA2_TESTES_ROLES.md`
- **Operação:** `docs/PROMOVER_NUTRICIONISTA.md`
