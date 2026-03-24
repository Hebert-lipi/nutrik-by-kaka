# Testes — fluxo de acesso profissional

Após `supabase db push` (migração `20260330120000_professional_access_requests.sql`).

## 1. Paciente pede acesso

1. Login com conta `patient` (sem ser staff clínico).
2. Abrir `/solicitar-acesso-profissional` (ou link no portal).
3. Enviar formulário → deve aparecer sucesso; novo envio bloqueado (“já existe pedido pendente”).

## 2. Staff analisa

1. Login com `nutritionist` ou `admin`.
2. **Painel → Acesso profissional** (`/dashboard/solicitacoes-acesso`).
3. Ver pedido na aba **Pendentes**.
4. **Aprovar** → `profiles.role` do solicitante passa a `nutritionist`.
5. Pedido do solicitante: status **Aprovado** no histórico.

## 3. Pós-aprovação (conta híbrida)

1. Com a conta aprovada: abrir `/dashboard` → deve carregar área clínica.
2. Se existir `auth_user_id` na ficha: abrir `/meu-plano` → portal continua acessível.

## 4. Recusa

1. Novo pedido (outra conta ou após novo fluxo se permitir novo pedido após recusa).
2. **Recusar** com nota → role permanece `patient`; solicitante não entra no dashboard.

## 5. Segurança

1. Como `patient`, tentar `insert` direto em `professional_access_requests` via API → deve falhar (sem política INSERT).
2. Como `patient`, chamar `review_professional_access_request` → `forbidden`.
