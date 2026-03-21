# Supabase — MVP Nutrik by Kaká

## 1. Aplicar o schema

1. Abra o projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá em **SQL Editor** → **New query**.
3. Cole o conteúdo completo de `supabase/migrations/20260320120000_mvp_patients_and_plans.sql`.
4. Execute (**Run**).

Isso cria:

- Tabelas `patients` e `diet_plans`
- Triggers de `updated_at`
- Função RPC `claim_patient_by_email()`
- Políticas RLS (nutricionista vs paciente)

## 2. Variáveis de ambiente

No `.env.local` (e no deploy), mantenha:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(Como já usados pelo login.)

## 3. Teste rápido do fluxo

1. **Nutricionista**: login → Pacientes → criar paciente com e-mail real (ex.: paciente@gmail.com).
2. **Plano**: Planos → Novo → tipo *Plano de paciente* → vincular paciente → Salvar → **Publicar**.
3. **Paciente**: criar usuário Auth com **o mesmo e-mail** (Magic Link / senha) OU usar conta de teste.
4. Acessar **`/meu-plano`**: na primeira carga, `claim_patient_by_email` vincula `auth_user_id`; o plano publicado aparece.

## 4. Contas separadas

- Se a nutricionista e o paciente usam **e-mails diferentes**, o paciente precisa de **conta Auth** com o e-mail cadastrado na ficha.
- Usuário **só paciente** (sem pacientes/planos como nutricionista) é redirecionado do dashboard para `/meu-plano` após o vínculo.

## 5. Limitações do MVP

- Histórico de revisões fica dentro de `structure_json` (sem tabela `plan_revisions`).
- Adesão do paciente (`/meu-plano`) continua em **localStorage** até próxima fase.
- Dois cadastros de paciente com o mesmo e-mail em nutricionistas diferentes: o RPC `claim` associa a linha **mais antiga** — evite no demo.
