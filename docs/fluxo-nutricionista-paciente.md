# Fluxo Nutricionista → Paciente (Nutrik by Kaká)

## Fluxo de dados (MVP Supabase)

1. **Criar paciente** → linha em `public.patients` (`nutritionist_user_id` = `auth.uid()`), ID UUID gerado pelo banco.
2. **Criar/editar dieta** → linha em `public.diet_plans`; refeições e histórico em `structure_json` (JSONB). Vínculo: `patient_id` quando for plano de paciente.
3. **Rascunho vs publicado** → colunas `status` e `published_at`. Paciente (RLS) lê só `published` do seu `patient_id`.
4. **Versionamento** → snapshots em `structure_json.revisionHistory` (até 120 entradas no app); sem tabela de revisões ainda.
5. **Paciente** → `/meu-plano`: RPC `claim_patient_by_email()` associa `patients.auth_user_id`; depois a query do plano publicado passa na RLS.

## Liberação da dieta (visão alvo)

| Etapa | Responsável | Comportamento |
|--------|-------------|----------------|
| Montar/editar | Nutricionista | Revisões em `revisionHistory`; rascunho não aparece no portal |
| Publicar | Nutricionista | `status: published` + vínculo ao paciente |
| Leitura | Paciente | Somente **última versão publicada** (modelo atual: um plano publicado por paciente) |
| Isolamento | Backend | RLS: paciente lê só seu plano; nutricionista escopo por `professional_id` |

## Portal do paciente — adesão

- Tabela **`patient_adherence_logs`** (Supabase): refeição/dia, dificuldade, observação diária (`scope` meal | daily).

## Histórico e segurança

- Revisões **não são apagadas** ao publicar de novo; o conteúdo antigo permanece no histórico.
- **Quem alterou**: preenchido com e-mail do usuário Supabase quando disponível; fallback `"Profissional (local)"`.
- **Tempo real**: hoje via eventos locais; futuro Supabase Realtime em `plan_revisions` / `patient_logs`.

## O que falta depois do MVP

- Tabela `plan_revisions` (ou stream de eventos) em vez de só JSON em `structure_json`.
- Adesão do paciente persistida no Supabase + visão na ficha da nutricionista.
- Metadados de perfil (`nutrik_role`) ou convites explícitos se houver ambiguidade de e-mail.
