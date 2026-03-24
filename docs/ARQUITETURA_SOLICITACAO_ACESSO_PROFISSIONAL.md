# Etapa 1 — Fluxo de solicitação de acesso profissional

## Objetivo

Permitir que utilizadores com `profiles.role = patient` peçam acesso à área clínica **sem promoção automática**. **Apenas administradores** (`profiles.role = admin`) aprovam ou recusam no próprio produto — **sem SQL manual** no dia a dia (exceto bootstrap do primeiro admin, se necessário).

## Onde os dados ficam

**Tabela `public.professional_access_requests`**

| Campo | Uso |
|-------|-----|
| `user_id` | Quem pediu (`auth.users.id`) |
| `requester_email` | Cópia do e-mail no pedido (facilita listagem para quem aprova) |
| `full_name`, `professional_registration`, `message` | Dados do formulário |
| `status` | `pending` \| `approved` \| `rejected` |
| `reviewed_by`, `reviewed_at`, `review_note` | Quem decidiu e quando |

**Índice único parcial:** no máximo **um** pedido `pending` por utilizador.

## Quem aprova

- **Apenas `profiles.role = 'admin'`** (migração `20260331100000_professional_requests_admin_only.sql`): RLS da tabela e a RPC `review_professional_access_request` exigem admin.
- Nutricionistas comuns **não** veem a fila nem aprovam.
- **Não há auto-aprovação:** promoção a `nutritionist` só após decisão explícita do admin na app.
- **Bootstrap:** o primeiro `admin` da clínica pode ser definido uma vez por SQL / Dashboard (ver `docs/VALIDACAO_VISUAL_FLUXO_ACESSO_PROFISSIONAL.md`).

## Como a promoção acontece

1. **Submissão:** RPC `submit_professional_access_request` (SECURITY DEFINER) valida: autenticado, role efectivamente `patient` (ou sem profile tratado como paciente), sem outro `pending`, insere linha.
2. **Revisão:** RPC `review_professional_access_request` (SECURITY DEFINER): só se `profiles.role = 'admin'`; bloqueia se não estiver `pending`; em caso de aprovação faz `UPDATE profiles SET role = 'nutritionist'`.
3. **RLS na tabela:** `SELECT` para o próprio autor **ou** admin (todos os pedidos); **sem** `INSERT`/`UPDATE` directos por cliente — só RPCs.

## Conta híbrida (nutricionista + paciente)

- `profiles.role` passa a `nutritionist` (ou `admin`); o vínculo **`patients.auth_user_id`** **não** é removido.
- Middleware e portal existentes continuam válidos: staff acede ao dashboard; se existir vínculo paciente, **`/meu-plano`** permanece acessível.

## O que não mudou

- Base `profiles.role` + middleware + RLS clínica anterior.
- Nenhuma promoção por “criou dados”.
- Pacientes sem aprovação continuam bloqueados na área clínica.

## Etapa 2 (implementado)

| Entrega | Local |
|---------|--------|
| Migração SQL (tabela + submit) | `supabase/migrations/20260330120000_professional_access_requests.sql` |
| Migração SQL (RLS + revisão só admin) | `supabase/migrations/20260331100000_professional_requests_admin_only.sql` |
| Pedido (paciente) | `/solicitar-acesso-profissional` + teaser em `/meu-plano` + link no header do layout paciente |
| Aprovação (admin) | `/dashboard/solicitacoes-acesso` + item “Acesso profissional” na sidebar / menu móvel (só admin) |
| Cliente Supabase | `src/lib/supabase/professional-access-requests.ts` |
| Testes manuais | `docs/ETAPA2_FLUXO_ACESSO_PROFISSIONAL.md` |
| Validação visual (URLs e checklist) | `docs/VALIDACAO_VISUAL_FLUXO_ACESSO_PROFISSIONAL.md` |
