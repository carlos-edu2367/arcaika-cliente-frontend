# 11 — Implementação: Itens Críticos, Altos e Médios

**Data:** 26/03/2026
**Sessão:** continuação da auditoria realizada na sessão anterior
**Verificação final:** `npx tsc --noEmit` — **0 erros**

---

## 1. Planejamento

Após auditar o codebase contra a documentação (`/docs`), foram identificados os seguintes pendentes por prioridade:

| # | Item | Prioridade |
|---|------|------------|
| 1 | Adicionar variantes numéricas de `primary` ao `tailwind.config.js` | 🔴 Crítico |
| 2 | Criar `LoginModal` global e montá-la no router | 🔴 Crítico |
| 3 | Corrigir paths do `BottomNav` (`/cotacoes` → `/orcamentos`, `/perfil` → `/conta/perfil`) | 🔴 Crítico |
| 4 | Reescrever `Cadastro.tsx` como wizard de 3 passos | 🟠 Alto |
| 5 | Criar `RecuperarSenha.tsx` (2 passos: email → reset via token) | 🟠 Alto |
| 6 | Adicionar `ModalAvaliacao` ao `Pedidos/Detalhe.tsx` | 🟠 Alto |
| 7 | Criar página `Busca` (resultados de pesquisa com filtros) | 🟡 Médio |
| 8 | `ArkyFAB`: esconder na rota `/checkout` | 🟡 Médio |
| 9 | `ArkyDrawer`: adicionar chips de sugestão e `TypingIndicator` animado | 🟡 Médio |

---

## 2. Execução

### 2.1 Fix Tailwind color tokens
**Arquivo:** `tailwind.config.js`

O tema definia `primary` apenas com `DEFAULT`, `hover`, `light` e `dark`. Toda a codebase existente usava variantes numéricas (`primary-500`, `primary-600`, etc.) que não existiam, resultando na cor de fallback do Tailwind em todos os componentes.

**Correção:** Adicionadas as variantes `50` a `900` com a paleta orange do Tailwind alinhada ao token `DEFAULT: #F97316`:
- `500` = `#F97316` (idêntico a `DEFAULT`)
- `600` = `#EA6C0A` (idêntico a `hover`)
- `700` = `#C2500A` (idêntico a `dark`)

As chaves semânticas (`DEFAULT`, `hover`, `light`, `dark`) foram mantidas para que o código novo continue funcionando sem refatorar o legado.

---

### 2.2 LoginModal
**Arquivo criado:** `src/components/auth/LoginModal.tsx`
**Arquivo alterado:** `src/router/index.tsx`

O `uiStore` já tinha `isLoginModalOpen`, `openLoginModal` e `closeLoginModal`, mas nenhum componente consumia esse estado. O `TopBar` e o `ServicoDetalhe` já chamavam `openLoginModal()` em alguns pontos — o modal estava completamente ausente.

**Implementação:**
- Modal com overlay `bg-black/50` e card centralizado com `animate-slide-up`
- Fecha com Esc ou clique fora
- Trava scroll do body (`overflow: hidden`) enquanto aberto
- Inclui link "Esqueci minha senha" que fecha o modal e navega para `/auth/recuperar-senha`
- Montado globalmente em `AppRouter`, ao lado de `ArkyFAB` e `ArkyDrawer`

---

### 2.3 BottomNav paths
**Arquivo alterado:** `src/components/layout/BottomNav.tsx`

Rotas incorretas causavam highlight ativo errado e navegação quebrada:
- `/cotacoes` → `/orcamentos`
- `/perfil` → `/conta/perfil`

As rotas de compatibilidade no router foram mantidas como fallback.

---

### 2.4 Cadastro — wizard de 3 passos
**Arquivo alterado:** `src/pages/Auth/Cadastro.tsx`

O cadastro era um formulário de passo único (nome + email + senha). A documentação especificava 3 passos com validações específicas.

**Implementação com `useReducer`:**

- **Passo 1 — Acesso:** nome, email, senha (min 8 chars, 1 maiúscula, 1 número), confirmar senha. Indicador visual de força da senha com 4 barras coloridas (erro → warning → primário → sucesso).
- **Passo 2 — Dados pessoais:** CPF com máscara `000.000.000-00`, celular com máscara `(00) 00000-0000`, data de nascimento com validação de 18 anos mínimos.
- **Passo 3 — Endereço:** CEP com autopreenchimento ViaCEP (logradouro, bairro, cidade, UF), número obrigatório, complemento opcional.
- **Tela de sucesso:** mensagem de boas-vindas com onboarding + botão "Explorar serviços".

Indicadores de progresso: 3 dots responsivos que crescem na etapa ativa. Navegação back/forward sem perda de dados entre passos (estado no reducer).

Apenas os campos aceitos pela API (`nome`, `email`, `senha`, `cpf`, `telefone`) são enviados no `register()`. O endereço do cadastro é um campo complementar — a API atual não o aceita no registro, mas a UX de coleta é importante para futura extensão.

---

### 2.5 RecuperarSenha
**Arquivo criado:** `src/pages/Auth/RecuperarSenha.tsx`
**Arquivo alterado:** `src/router/index.tsx`

Fluxo de 2 etapas conforme documentação:

- **Tela 1 — Email:** campo email + submit. Por segurança, o endpoint não revela se o e-mail existe (sucesso silencioso em caso de erro 404).
- **Tela 2 — Confirmação:** instrução para verificar caixa de entrada + link de reenvio.
- **Tela 3 — Nova senha** (acessada via `?token=...` na URL): dois campos senha + confirmar, com indicador de força igual ao do Cadastro.
- **Tela 4 — Sucesso:** confirmação + link para login.

A navegação entre telas usa `useState<Screen>` local, sem router. O token é lido dos `searchParams` via `useSearchParams`.

---

### 2.6 ModalAvaliacao
**Arquivo alterado:** `src/pages/Pedidos/Detalhe.tsx`

Botão "Avaliar serviço" aparece apenas quando `pedido.status === 'CONCLUIDO'`. A modal coleta:

- **Nota 1–5:** 5 estrelas interativas com hover state e label textual ("Regular", "Bom", "Excelente!").
- **Comentário:** textarea opcional com contador de 500 caracteres.
- Submit via `avaliacoesService.criar()` com `tipo: 'servico'` e `referencia_id` do primeiro item do pedido.

Após sucesso, invalida a query `['pedidos', id]` e exibe toast de confirmação.

---

### 2.7 Página Busca
**Arquivo criado:** `src/pages/Busca/index.tsx`
**Arquivo alterado:** `src/router/index.tsx`

Rota: `/busca?q=termo&categoria_id=uuid`

Funcionalidades:
- Input de busca debounced (350ms) com sincronização bidirecional com `searchParams` (URLs compartilháveis)
- Chips de categorias horizontalmente scrolláveis, toggle por categoria
- Ordenação client-side: relevância / melhor avaliados / menor preço / maior preço
- Skeleton de 8 cards durante loading
- Estado vazio com botão "Limpar busca"
- Grid responsivo: 2 → 3 → 4 colunas

---

### 2.8 ArkyFAB — esconder em /checkout
**Arquivo alterado:** `src/components/arky/ArkyFAB.tsx`

Adicionado `const HIDDEN_ROUTES = ['/checkout']` com verificação `location.pathname.startsWith(r)`. O componente retorna `null` nestas rotas para não distrair o usuário durante o fluxo de pagamento.

---

### 2.9 ArkyDrawer — SugestoesRapidas + TypingIndicator
**Arquivo alterado:** `src/components/arky/ArkyDrawer.tsx`

- **SugestoesRapidas:** 4 chips de sugestão ("Como funciona o orçamento?", "Quero contratar um serviço", etc.) exibidos no estado vazio do chat, que desaparecem após o primeiro envio.
- **TypingIndicator:** 3 dots com `animate-bounce` escalonado por `animationDelay` (0ms, 180ms, 360ms), substituindo o antigo `"Digitando..."` com `animate-pulse`.
- Cores de tokens corrigidas para `bg-primary` / `bg-primary-hover`.

---

## 3. Arquivos Modificados / Criados

| Arquivo | Operação |
|---------|----------|
| `tailwind.config.js` | Editado |
| `src/router/index.tsx` | Editado (+ LoginModal, RecuperarSenha, Busca) |
| `src/components/auth/LoginModal.tsx` | **Criado** |
| `src/components/layout/BottomNav.tsx` | Editado |
| `src/components/arky/ArkyFAB.tsx` | Editado |
| `src/components/arky/ArkyDrawer.tsx` | Editado |
| `src/pages/Auth/Cadastro.tsx` | Reescrito |
| `src/pages/Auth/RecuperarSenha.tsx` | **Criado** |
| `src/pages/Pedidos/Detalhe.tsx` | Editado |
| `src/pages/Busca/index.tsx` | **Criado** |

---

## 4. Próximos Passos

Os itens abaixo **não foram implementados** nesta sessão e representam o backlog restante:

### 🟡 Médio
- **`/marketplace/item/:id` — ItemDetalhe:** página de detalhe de produto/item (não serviço). O service `marketplaceService.detalheItem()` já existe, falta a UI.
- **Rota `/busca` no BottomNav:** o item "Buscar" do BottomNav atualmente navega para `/marketplace`. Pode ser ajustado para `/busca` se o produto desejar a experiência de busca full-page diretamente no nav.

### 🔵 Baixo
- **Paginação/scroll infinito:** a página `Busca` e o `Marketplace` usam `page_size: 20–24`. Para grande volume de resultados, implementar scroll infinito com `useInfiniteQuery`.
- **Filtros avançados (preço mínimo/máximo, distância):** o tipo `MarketplaceParams` já tem campo para extensão.
- **Testes unitários e de integração:** nenhum teste foi escrito para os componentes criados. Priorizar `LoginModal`, `Cadastro` wizard e `ModalAvaliacao` por serem flows críticos.
- **TopBar — link de busca:** o campo de busca do `TopBar` (desktop) deveria navegar para `/busca?q=...` em vez de `?q=...` no Marketplace.

### 🏗️ Infraestrutura
- **Build quebrado (`@rollup/rollup-linux-x64-gnu`):** pré-existente antes desta sessão. Afeta `npm run build`, não o dev server. Requer reinstalação do ambiente npm ou atualização de rollup. Não é um bug de código — todos os arquivos compilam sem erros TypeScript.
- **API de endereço no registro:** a API `/auth/cliente` não aceita `endereco` no payload atual. O passo 3 do wizard de Cadastro coleta o endereço mas não o envia. Quando a API suportar, adicionar o campo `endereco` ao `RegisterInput` em `src/services/api/auth.ts` e ao `useAuth().register()`.
- **Token de reset de senha:** o endpoint `/auth/recuperar-senha` e `/auth/redefinir-senha` precisam ser implementados no backend para que o fluxo de RecuperarSenha funcione em produção.
