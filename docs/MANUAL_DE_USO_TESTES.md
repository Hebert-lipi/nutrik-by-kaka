# Nutrik — Manual de uso para testes (usuários reais)

Este guia é para **quem vai experimentar o sistema** antes do lançamento. Não é necessário conhecimento técnico.

---

## 1. O que é o Nutrik (nesta versão)

O Nutrik tem **dois “mundos”** no mesmo site:

| Perfil | Quem é | O que faz |
|--------|--------|-----------|
| **Nutricionista** | Profissional | Cadastra pacientes, monta planos alimentares, publica o que o paciente vê no app. |
| **Paciente** | Pessoa acompanhada | Vê o **plano publicado**, pode marcar adesão e (se liberado) usar lista de compras. |

Você pode testar **só um** dos perfis ou **os dois**, se a organização do teste permitir.

---

## 2. Antes de começar

1. **Link e ambiente**  
   Use exatamente o **endereço (URL)** que a equipe enviou (teste / homologação).

2. **Conta**  
   Você receberá **e-mail e senha** (ou instruções para criar conta). Guarde em local seguro.

3. **Navegador**  
   Prefira **Chrome**, **Edge** ou **Firefox** atualizados. No celular, pode testar pelo navegador também.

4. **Paciente vinculado ao portal**  
   Para o paciente ver o plano em **“Meu plano”**, o cadastro dele na área da nutricionista deve usar o **mesmo e-mail** com que o paciente faz login. A equipe pode já ter deixado isso configurado para você.

---

## 3. Nutricionista — primeiro acesso

### 3.1 Entrar

1. Abra o link do Nutrik.  
2. Vá em **Login** / **Entrar**.  
3. Informe **e-mail** e **senha**.  
4. Se algo falhar, anote a **mensagem na tela** (ou tire um print).

### 3.2 Menu principal (computador)

No lado esquerdo (ou no **menu ☰** no celular) você encontra:

- **Painel** — visão geral.  
- **Pacientes** — lista e ficha de cada pessoa.  
- **Biblioteca** — planos alimentares (modelos e planos por paciente).  
- **Meu plano** — atalho para a **visão do paciente** (só faz sentido se você estiver logado com conta de paciente ou quiser ver como fica).

### 3.3 Pacientes

1. Clique em **Pacientes**.  
2. **Novo paciente** (ou equivalente): preencha nome, e-mail, telefone, etc., conforme o formulário.  
3. Abra a **ficha** de um paciente clicando nele na lista.

**Dentro da ficha** você pode explorar abas/seções, por exemplo:

- **Resumo** — visão rápida.  
- **Perfil** — dados e observações.  
- **Plano** — plano ativo no portal, rascunhos, publicar / despublicar.  
- **Histórico** — linha do tempo.  
- **Diário**, **Lista de compras**, **Receitas**, **Materiais**, **Avaliações** — conforme a equipe tiver ativado.

**O que testar:** criar paciente, editar dados, salvar, voltar à lista e confirmar se aparece certo.

### 3.4 Biblioteca de planos

1. Clique em **Biblioteca**.  
2. **Novo plano** — o fluxo costuma perguntar se é **modelo** (biblioteca) ou **plano para um paciente**.  
3. No **editor de plano**: adicione refeições, grupos, alimentos, textos. Use **Salvar** / **Publicar** conforme os botões mostrados.

**Importante para o paciente ver o cardápio:**

- O plano precisa estar **vinculado ao paciente** (quando for plano de paciente).  
- O status deve ser **publicado** (ou a ação **Publicar** deve ser usada), conforme a interface.  
- Só pode haver **um plano publicado** por paciente neste modelo — publicar um novo desativa o anterior para o portal.

**O que testar:** criar plano, salvar rascunho, abrir de novo, publicar, ver na ficha do paciente em **Plano** se aparece como ativo.

### 3.5 PDF (se existir no seu fluxo)

Se houver opção de **gerar PDF** do plano, teste abrir e baixar. Em planos grandes, pode demorar alguns segundos — anote se travou ou deu erro.

---

## 4. Paciente — “Meu plano”

### 4.1 Entrar como paciente

1. **Saia** da conta da nutricionista (botão de **Sair** / **Logout**), se estiver nela.  
2. Entre com o **e-mail do paciente** e a **senha** que a equipe passou.  
   - Esse e-mail deve ser o **mesmo** cadastrado na ficha do paciente.

### 4.2 Abrir “Meu plano”

1. No menu, toque em **Meu plano** (ou acesse o caminho que a equipe indicar).  
2. Você deve ver o **cardápio** que a nutricionista **publicou** para você.

**Se aparecer que não está vinculado ou não há plano:**

- Confirme com a equipe se o e-mail do login = e-mail do cadastro.  
- Confirme se existe **plano publicado** para esse paciente.

### 4.3 Adesão e lista de compras (se aparecerem)

- Marque refeições / dia conforme a tela permitir.  
- Se houver **lista de compras**, teste editar itens e salvar (se existir botão de salvar).

---

## 5. Celular vs computador

- **Computador:** melhor para montar planos longos e revisar fichas.  
- **Celular:** ideal para ver como o paciente usa **Meu plano** no dia a dia.

Teste **pelo menos um fluxo completo** em cada um, se puder.

---

## 6. O que anotar ao testar (feedback útil)

Para cada problema, tente enviar:

1. **O que você queria fazer** (ex.: “publicar plano para a Maria”).  
2. **O que aconteceu** (ex.: “apareceu mensagem em vermelho…”).  
3. **Onde estava** (ex.: “Biblioteca”, “Ficha do paciente > Plano”).  
4. **Print ou vídeo curto** (opcional, mas ajuda muito).  
5. **Navegador e dispositivo** (ex.: “Chrome no Android”).

Se algo for **lento**, diga **em qual tela** e **quanto tempo pareceu razoável ou excessivo**.

---

## 7. Problemas comuns

| Situação | O que verificar |
|----------|-----------------|
| “Não autenticado” / volta para o login | Sessão expirou; entre de novo. |
| Paciente não vê o plano | Mesmo e-mail no cadastro e no login? Plano está **publicado**? |
| Plano não publica | Paciente está selecionado no plano? Alguma mensagem de erro na tela? |
| Página em branco ou “erro” | Atualize a página (F5). Se repetir, envie print com o horário aproximado. |
| Dados antigos | A nutricionista pode precisar **atualizar** a lista (sair e entrar, ou ação de atualizar se existir). |

---

## 8. Privacidade e dados de teste

- Use **dados fictícios** sempre que possível (nomes inventados, e-mails de teste).  
- **Não** use senhas que você usa em banco, e-mail pessoal ou outros sites.  
- Trate as fichas como **informação sensível**, mesmo em teste.

---

## 9. Contato

Dúvidas ou bloqueios: use o **canal que a equipe do projeto indicou** (WhatsApp, e-mail, grupo do teste).

---

**Boa sessão de testes — obrigado por ajudar a melhorar o Nutrik.**
