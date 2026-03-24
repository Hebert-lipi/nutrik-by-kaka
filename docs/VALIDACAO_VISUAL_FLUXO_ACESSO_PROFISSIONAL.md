# Onde está o formulário vs. onde está a aprovação

São **duas áreas diferentes** da aplicação:

| O quê | Quem | URL / sítio na UI |
|-------|------|-------------------|
| **Formulário de pedido** (enviar solicitação) | Utilizador com `role = patient` (portal) | **`/solicitar-acesso-profissional`** |
| **Fila de aprovação** (pendentes + histórico) | Utilizador com **`role = admin`** | **`/dashboard/solicitacoes-acesso`** (só aparece no menu lateral se fores admin) |

A nutricionista **comum** (`nutritionist`) **não** vê o item “Acesso profissional” no menu e **não** consegue aprovar pedidos (RLS + RPC).

---

## 1. Onde o paciente vê “solicitar acesso profissional”

### A) Link fixo no topo do portal (todas as páginas do layout paciente)

- Ao usar **Meu plano** e outras rotas sob o layout “Seu plano alimentar”, no canto superior direito há:
  - **Área da nutricionista** → vai para o dashboard (se fores só paciente, o middleware redireciona de volta ao portal).
  - **Sou nutricionista — solicitar acesso** → abre **`/solicitar-acesso-profissional`** (o formulário).

### B) Cartão no final de `/meu-plano`

- Título **“Nutricionista?”**
- Botão principal **“Abrir formulário de pedido”** (ou **“Ver status do pedido”** se já existir pedido pendente).
- Também aparece nos estados **conta não vinculada** e **sem plano publicado** (no fim da página).

### C) URL directa (para testes)

1. Entra com uma conta **patient**.
2. No browser: **`/solicitar-acesso-profissional`**
3. Deves ver o formulário (nome, registro opcional, mensagem).

### Quando o teaser **não** aparece

- Se `profiles.role` já for **`nutritionist`** ou **`admin`**, o cartão “Nutricionista?” **não** é mostrado (já tens acesso clínico).

---

## 2. Fluxo ponta a ponta (checklist)

1. **Paciente** faz login (OTP) → cai em **`/meu-plano`** (ou portal).
2. Clica **“Sou nutricionista — solicitar acesso”** no header **ou** **“Abrir formulário de pedido”** no cartão **ou** abre a URL **`/solicitar-acesso-profissional`**.
3. Preenche e **envia** → pedido fica **`pending`** na base.
4. **Admin** faz login → no menu lateral aparece **Acesso profissional** → **`/dashboard/solicitacoes-acesso`**.
5. Vê o pedido em **Pendentes** → **Aprovar** ou **Recusar**.
6. Se **aprovar**: `profiles.role` do solicitante passa a **`nutritionist`**.
7. O mesmo utilizador, no próximo carregamento, acede ao **dashboard** e, se tiver vínculo `auth_user_id` na ficha, continua a poder abrir **`/meu-plano`** (conta híbrida).

---

## 3. Regra de aprovação (governação)

- **Só `admin`** pode:
  - **ver** todos os pedidos (RLS),
  - **chamar** `review_professional_access_request` com sucesso.
- **`nutritionist`** sem admin:
  - não vê o item **Acesso profissional** no menu;
  - se abrir a URL à mão, vê a mensagem “Acesso restrito a administradores”;
  - a API de revisão devolve erro.

Migração: **`20260331100000_professional_requests_admin_only.sql`**

### Primeiro admin na clínica

Quem ainda não tem nenhum `admin` precisa de **uma** promoção inicial (SQL ou Supabase Dashboard), por exemplo:

```sql
UPDATE public.profiles SET role = 'admin', updated_at = now()
WHERE id = '<uuid do utilizador>';
```

Depois disso, esse admin usa a **fila na app** para aprovar novos profissionais (que passam a `nutritionist`).

---

## 4. Evidência visual rápida

| Passo | O que deves ver |
|-------|------------------|
| Paciente abre formulário | Página com título **“Solicitar acesso à área clínica”** e campos Nome / Registro / Mensagem |
| Após enviar | Mensagem de sucesso; tentar enviar outro com o mesmo utilizador bloqueado (“já existe pedido pendente”) até haver decisão |
| Admin abre fila | Menu **Acesso profissional** + lista **Pendentes** com e-mail e nome do pedido |
| Nutri comum | **Sem** item “Acesso profissional”; URL da fila mostra empty state de permissão |

---

*Alinhado com `docs/ARQUITETURA_SOLICITACAO_ACESSO_PROFISSIONAL.md` (actualizar secção “quem aprova” para admin only após migração acima).*
