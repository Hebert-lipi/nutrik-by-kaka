# Checklist de validação — onboarding profissional (solo × clínica)

Use após aplicar a migration `20260402120000_professional_onboarding_solo_clinic.sql` no Supabase.

## Pré-requisitos

- [ ] Migration aplicada (`profiles.onboarding_professional_choice`, RPCs `claim_solo_nutritionist_access`, `mark_professional_clinic_flow`, `clear_professional_onboarding_choice`).
- [ ] Tabelas `clinics` e `clinic_members` existentes (workspace fase 0+).

## Solo (imediato)

- [ ] Login com **Sou nutricionista** → `/profissional/como-usa`.
- [ ] **Trabalhar sozinho** → painel `/dashboard` sem aprovação.
- [ ] Em `clinics`, existe registro com `slug = personal-<uuid_sem_hífens>` e nome `Clínica de <rótulo>`.
- [ ] Em `clinic_members`, uma linha ativa para o utilizador nessa clínica (sem duplicar em re-chamadas).
- [ ] Segunda chamada à RPC (ou recarregar e repetir) retorna `already: true` e **não** duplica `clinic_members`.
- [ ] `profiles.onboarding_professional_choice` fica `NULL` após solo.

## Clínica (aprovação)

- [ ] Em `/profissional/como-usa`, **Fazer parte de uma clínica** → `/acesso-profissional`.
- [ ] `profiles.onboarding_professional_choice = 'clinic'` (persistido no servidor).
- [ ] Sem esse valor, `/acesso-profissional` e `/solicitar-acesso-profissional` redirecionam para `/profissional/como-usa` (middleware + perfil).
- [ ] Pedido submetido segue fluxo de aprovação existente (admin).

## Paciente (isolamento)

- [ ] Login **Entrar como paciente** → `/meu-plano` sem CTAs de nutricionista no portal.
- [ ] Cookie legado `nutrik_professional_path` **não** libera formulário nem `/acesso-profissional` sozinho.

## Segurança e dados

- [ ] Cookie não é usado como fonte de verdade no middleware (gate por `profiles.onboarding_professional_choice` + `intent` + `isClinicalStaff`).
- [ ] Conta sem staff clínico não acede a `/dashboard` nem rotas internas (RLS + middleware).
- [ ] **Alterar forma de uso** em `/acesso-profissional` limpa `onboarding_professional_choice` e volta a `/profissional/como-usa`.

## Observação

- `nutrik_entry_intent` continua sendo cookie de **UX de login** (paciente vs profissional), não substitui `profiles.role` para autorização de dados; o middleware combina intenção com contexto carregado do Supabase.
