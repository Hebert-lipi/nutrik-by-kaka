# Paciente vs nutricionista — como o Nutrik decide o acesso

> **Actualização:** o modelo oficial passou a usar **`public.profiles.role`**. Ver `docs/ARQUITETURA_ROLES_NUTRIK.md`. O texto abaixo descreve o comportamento **anterior** (derivado só de dados) e permanece como referência histórica.

---

## (Histórico — antes de profiles.role)

## Por que um paciente “não entra como nutricionista”?

Não é um bug: é a **regra atual** do sistema.

- **Paciente** = existe uma linha em `patients` com `auth_user_id` igual ao teu utilizador Supabase (depois do *claim* por e-mail igual ao cadastro).
- **Nutricionista** (área clínica) = existe **pelo menos um** registo em que és dono do workspace:  
  `patients.nutritionist_user_id = teu id` **ou** `diet_plans.nutritionist_user_id = teu id`.

Quem foi **só** cadastrado como paciente na ficha de um profissional fica com `auth_user_id` preenchido, mas **`nutritionist_user_id` na linha dele é sempre o ID do profissional**, não o do paciente.  
Por isso `isNutritionist` fica **falso** e o *middleware* **não deixa** usar `/dashboard`, `/patients`, `/diet-plans` — redireciona para **`/meu-plano`**.

Ficheiros de referência: `src/lib/auth/user-context.ts`, `src/middleware.ts`.

### E se a mesma pessoa for nutricionista e paciente?

Se o mesmo `auth.uid()` for dono de dados como nutri **e** tiver ficha com `auth_user_id` (ex.: profissional cadastrado como paciente noutro consultório), o código prevê **os dois**: área interna liberada **e** `/meu-plano` para o plano da ficha onde está vinculado.

---

## “Qualquer um que cria conta vira nutricionista?” — risco atual

1. O login usa OTP com **`shouldCreateUser: true`** — qualquer e-mail pode criar utilizador.
2. Nas políticas RLS, **qualquer** `authenticated` pode inserir em `patients` desde que `nutritionist_user_id = auth.uid()` (é o modelo “cada login é um espaço clínico”).
3. Quem **ainda não** tem pacientes nem planos tem `isNutritionist = false` mas `resolvePostAuthPath` manda para **`/dashboard`** (não é paciente → não entra só em `/meu-plano`).  
   Na prática, na primeira ação “Criar paciente”, passa a existir dado com `nutritionist_user_id` dele → **passa a ser nutricionista** no sentido do middleware.

Ou seja: **não há hoje um “cadastro aprovado de profissional”** separado; o primeiro uso da área clínica já te associa como dono dos dados.

---

## Como melhorar (sem bagunça de “paciente a fingir nutri”)

Escolhe conforme o modelo de negócio (SaaS aberto vs convites vs B2B).

### A) Lista de permissão por e-mail (simples)

- Tabela `nutritionist_allowlist (email text primary key)` ou `allowed_professionals`.
- No login ou no `getUserContext`, só `isNutritionistWorkspace = true` se o e-mail estiver na lista **ou** já for dono legítimo de dados.
- Pacientes continuam só com `isPatient` e nunca entram no dashboard mesmo que o e-mail não esteja na lista.

*Prós:* rápido de implementar. *Contras:* gestão manual de e-mails.

### B) Metadados Supabase (`user_metadata` / `app_metadata`)

- Campo `role: 'nutritionist' | 'patient'` (idealmente **`app_metadata`** via serviço/admin, não editável no cliente).
- Middleware / `getUserContext` consulta isso **antes** ou **em conjunto** com as contagens atuais.
- *Profissionais*: só convite ou painel admin define `app_metadata.role = nutritionist`.

*Prós:* padrão comum; integra com painel Supabase. *Contras:* precisa fluxo para definir role na criação do user.

### C) Tabela `profiles` + convite

- `profiles (id uuid PK → auth.users, role, invited_by, created_at)`.
- Signup “paciente” vs “profissional” com URLs diferentes; ou só convite com token para criar conta de nutri.
- RLS em `patients`/`diet_plans` pode exigir `exists (select 1 from profiles where id = auth.uid() and role = 'nutritionist')`.

*Prós:* modelo claro e escalável. *Contras:* mais migração e UI.

### D) Desativar criação automática de utilizador no OTP público

- Para ambiente fechado: `shouldCreateUser: false` e só utilizadores pré-criados no Supabase Auth recebem código.
- Combina com A ou B.

---

## Resumo para utilizadores finais

| Situação | Comportamento esperado hoje |
|----------|----------------------------|
| Sou só paciente (e-mail igual ao da ficha) | Entro e vou para **Meu plano**; não acedo ao painel clínico. |
| Sou nutricionista (criei pacientes/planos com esta conta) | Acesso a **Painel / Pacientes / Biblioteca**. |
| Quero que pacientes nunca “vir nutri” | Precisas de uma das camadas **A–D** acima; o modelo atual não distingue “tipo de conta” no registo. |

---

*Última atualização: alinhado ao código em `user-context.ts` e `middleware.ts`.*
