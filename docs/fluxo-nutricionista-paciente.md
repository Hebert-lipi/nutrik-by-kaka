# Fluxo Nutricionista → Paciente (Nutrik by Kaká)

## Fluxo de dados (frontend atual)

1. **Criar paciente** → `DraftPatient` com **ID único** (`crypto.randomUUID()`), armazenado em `localStorage` (demo).
2. **Criar/editar dieta** → `DraftPlan` com `planKind: template | patient_plan` e `linkedPatientId` quando for plano de paciente.
3. **Rascunho vs publicado** → `status: draft | published`. O paciente consome apenas planos **`published`** vinculados a ele (`getPublishedPlanForPatient`).
4. **Versionamento** → Cada salvamento no construtor acrescenta um snapshot em `revisionHistory` (com `savedAt`, `versionNumber`, refeições daquele momento, **`changedByLabel`** / **`changedByUserId`** quando há sessão Supabase). Mantém até **120** revisões por plano neste dispositivo (no servidor, ilimitado + arquivo).
5. **Paciente** → `/meu-plano`: e-mail da sessão Supabase casado com `DraftPatient.email` **no mesmo navegador** (demo). **Sem** sidebar da nutricionista.

## Liberação da dieta (visão alvo)

| Etapa | Responsável | Comportamento |
|--------|-------------|----------------|
| Montar/editar | Nutricionista | Revisões em `revisionHistory`; rascunho não aparece no portal |
| Publicar | Nutricionista | `status: published` + vínculo ao paciente |
| Leitura | Paciente | Somente **última versão publicada** (modelo atual: um plano publicado por paciente) |
| Isolamento | Backend | RLS: paciente lê só seu plano; nutricionista escopo por `professional_id` |

## Portal do paciente — adesão (local, espelho da API)

- Arquivo `src/lib/patient-adherence-storage.ts`: por `patientId` + `planId` + **data (YYYY-MM-DD)**.
- Campos: refeição **realizada**, **dificuldade**, **observação diária**.
- Evento `nutrik-patient-adherence` para reatividade entre abas (mesmo origem).

## Histórico e segurança

- Revisões **não são apagadas** ao publicar de novo; o conteúdo antigo permanece no histórico.
- **Quem alterou**: preenchido com e-mail do usuário Supabase quando disponível; fallback `"Profissional (local)"`.
- **Tempo real**: hoje via eventos locais; futuro Supabase Realtime em `plan_revisions` / `patient_logs`.

## O que falta para backend real

- Tabelas: `patients`, `diet_plans`, `plan_revisions` (ou JSONB versionado), `patient_adherence_logs`, `profiles` com role.
- Políticas RLS e API que não exponham planos de outros pacientes.
- **Redirect pós-login** por role (`/dashboard` vs `/meu-plano`).
- Substituir `localStorage` por fetch + cache; sincronizar adesão e “última revisão vista” no servidor.
