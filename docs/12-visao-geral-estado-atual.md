# 12 — Visão Geral: Estado Atual do Frontend

**Data:** 26/03/2026
**Build:** `npx tsc --noEmit` → 0 erros
**Stack:** Vite + React + TypeScript · Tailwind CSS · TanStack Query v5 · Zustand · React Hook Form + Zod · Axios · React Router v6

---

## 1. Arquitetura Geral

```
src/
├── pages/          → Todas as telas, lazy-loaded via React.lazy
├── components/
│   ├── layout/     → TopBar, BottomNav, PageWrapper, Container
│   ├── arky/       → ArkyFAB, ArkyDrawer
│   ├── auth/       → LoginModal, RequireAuth
│   ├── marketplace/→ ServiceCard
│   ├── shared/     → componentes cross-page
│   └── ui/         → Button, Input, Modal, Badge, Spinner, Skeleton, Toast...
├── hooks/          → TanStack Query wrappers (useCarrinho, usePedidos, etc.)
├── services/api/   → Chamadas HTTP via Axios
├── stores/         → authStore (persist), carrinhoStore, uiStore (Zustand)
├── types/          → domain.ts, api.ts, ui.ts
└── router/         → BrowserRouter com todas as rotas
```

**Fluxo de estado:**
- **Servidor:** TanStack Query (cache, revalidação, mutations)
- **Auth:** Zustand persist (token em localStorage, auto-rehydrate)
- **Carrinho:** Zustand (contador de badge) + TanStack Query (dados reais)
- **UI global:** Zustand (toast queue, Arky open/close, LoginModal open/close)
- **Wizard state:** useReducer local por página

**HTTP:**
- Axios com interceptor de request (injeta `Bearer token`) e response (redireciona para `/auth/login` em 401)
- `baseURL` via `VITE_API_URL` env var, fallback `localhost:8000`

---

## 2. Rotas Disponíveis

| Rota | Componente | Auth | Status |
|------|-----------|------|--------|
| `/` | `Home` | — | ✅ |
| `/marketplace` | `Marketplace` | — | ✅ |
| `/servicos/:id` | `ServicoDetalhe` | — | ✅ |
| `/busca` | `Busca` | — | ✅ |
| `/auth/login` | `Login` | — | ✅ |
| `/auth/cadastro` | `Cadastro` (wizard) | — | ✅ |
| `/auth/recuperar-senha` | `RecuperarSenha` | — | ✅ |
| `/carrinho` | `Carrinho` | ✅ | ✅ |
| `/checkout` | `Checkout` (wizard) | ✅ | ✅ |
| `/pedidos` | `Pedidos` | ✅ | ✅ |
| `/pedidos/:id` | `PedidoDetalhe` | ✅ | ✅ |
| `/orcamentos` | `Orcamentos` | ✅ | ✅ |
| `/orcamentos/novo` | `NovaCotacao` (wizard) | ✅ | ✅ |
| `/orcamentos/:id` | `CotacaoDetalhe` | ✅ | ✅ |
| `/conta/perfil` | `Perfil` | ✅ | ✅ |
| `/conta/senha` | `Senha` | ✅ | ✅ |
| `/conta/enderecos` | `Enderecos` | ✅ | ✅ |
| `/conta/avaliacoes` | `Avaliacoes` | ✅ | ✅ |
| `*` | `NotFound (404)` | — | ✅ |

---

## 3. Telas Implementadas — Detalhe

### 3.1 Home (`/`)
Página pública de entrada.
- Hero com gradient laranja, CTA para Marketplace
- Grid de categorias (API: `/marketplace/categorias`)
- Seção de serviços recomendados via Arky (API: `/marketplace/recomendacoes`)
- Destaques: Busca rápida + diferenciais da plataforma

---

### 3.2 Marketplace (`/marketplace`)
Vitrine paginada de serviços.
- Barra de busca debounced com limpeza rápida
- Chips de filtro por categoria (scroll horizontal)
- Grid responsivo de `ServiceCard` (2 → 3 → 4 colunas)
- Estado de loading: Spinner (⚠️ deveria ser Skeleton — ver §6)
- Parâmetros via `useSearchParams` para URLs compartilháveis

---

### 3.3 Busca (`/busca`)
Página dedicada de resultados de pesquisa.
- Input autofocado com debounce de 350ms
- Sincronização bidirecional com URL (`?q=...&categoria_id=...`)
- Chips de categoria com toggle
- Ordenação client-side: Relevância / Melhor avaliados / Menor preço / Maior preço
- **Skeleton loading** (8 cards) ✅
- Estado vazio com botão "Limpar busca"

---

### 3.4 Detalhe de Serviço (`/servicos/:id`)
Página de produto detalhada.
- Galeria de imagens com thumbnails e navegação
- Informações do serviço (preço, descrição, tags, localidade)
- Card do prestador com avaliação média
- Lista de avaliações (TanStack Query: `/avaliacoes/servico/:id`)
- Sidebar sticky desktop: botões "Adicionar ao carrinho" + "Solicitar orçamento"
- Barra fixa mobile (bottom) com as mesmas ações
- Botão "Entrar" abre `LoginModal` se não autenticado

---

### 3.5 Login (`/auth/login`)
Formulário simples de autenticação.
- Email + senha com validação Zod
- Navega para `from` após login (proteção de rota integrada)
- Link para cadastro e recuperação de senha

---

### 3.6 Cadastro (`/auth/cadastro`) — Wizard 3 passos
Multi-step com `useReducer`, dados persistidos entre passos.
- **Passo 1 — Acesso:** nome, email, senha (min 8, 1 maiúscula, 1 número, indicador de força 4 barras), confirmar senha
- **Passo 2 — Dados pessoais:** CPF com máscara `000.000.000-00`, celular `(00) 00000-0000`, data de nascimento com validação de 18 anos mínimos
- **Passo 3 — Endereço:** CEP com autopreenchimento ViaCEP, logradouro, número, complemento, bairro, cidade, UF
- **Tela de sucesso:** boas-vindas por nome + CTA para explorar serviços
- Progress dots animados (3 pontos responsivos)

---

### 3.7 Recuperar Senha (`/auth/recuperar-senha`)
Fluxo de 4 telas com `useState<Screen>`.
- **Tela email:** campo + submit. Sucesso silencioso (não revela se e-mail existe)
- **Tela enviado:** instrução para verificar caixa + link de reenvio
- **Tela nova senha:** acessada via `?token=...` na URL. Campos senha + confirmar com indicador de força
- **Tela sucesso:** confirmação + link para login
- Endpoints: `POST /auth/recuperar-senha` · `POST /auth/redefinir-senha` *(backend pendente)*

---

### 3.8 Carrinho (`/carrinho`)
- Lista de itens com stepper de quantidade (useMutation)
- Remover item com confirmação inline
- Input de cupom com aplicar/remover
- Resumo: subtotal, desconto (linha verde), total
- Sidebar sticky no desktop com botão "Finalizar pedido"
- CTA vazio para ir ao Marketplace

---

### 3.9 Checkout (`/checkout`) — Wizard 5 passos
Multi-step com `useReducer`, protegido por `RequireAuth`.
- **Passo 1 — Revisão do carrinho:** lista de itens, total
- **Passo 2 — Endereço:** seleção de endereços cadastrados + formulário inline de novo endereço com ViaCEP
- **Passo 3 — Agendamento:** seletor de data + período (manhã/tarde/noite)
- **Passo 4 — Resumo:** revisão geral + aplicar cupom
- **Passo 5 — Pagamento:** redirect para Mercado Pago via `checkout_url` da API
- **Tela de confirmação:** exibida após retorno com status `sucesso`
- Barra de progresso no topo (steps 1–5)
- ArkyFAB **escondido** nesta rota ✅

---

### 3.10 Pedidos (`/pedidos`)
- Tabs de status: TODOS / PENDENTE / EM_ANDAMENTO / CONCLUÍDO / CANCELADO
- Lista de `PedidoCard` com badge de status colorido e link para detalhe
- Skeleton loading ✅
- Estado vazio com CTA para Marketplace

---

### 3.11 Detalhe de Pedido (`/pedidos/:id`)
- Timeline visual de 4 etapas (Pendente → Confirmado → Em andamento → Concluído)
- Lista de itens com foto, nome, quantidade, valor
- Sidebar: endereço de execução, data agendada, resumo financeiro (subtotal/desconto/total), método de pagamento
- **Botão "Avaliar serviço"** (aparece apenas em CONCLUÍDO) → abre `ModalAvaliacao`
  - 5 estrelas com hover interativo + label textual
  - Textarea opcional com contador de caracteres
  - Submit via `avaliacoesService.criar()`
- **Botão "Cancelar pedido"** (aparece em PENDENTE e CONFIRMADO) → modal de confirmação
- Status CANCELADO oculta a timeline

---

### 3.12 Orçamentos (`/orcamentos`)
- Tabs de status: TODOS / ABERTA / COM_PROPOSTAS / ACEITA / CANCELADA
- Lista de `CotacaoCard` com data, categoria, status
- Botão flutuante "Nova cotação" → `/orcamentos/novo`

---

### 3.13 Nova Cotação (`/orcamentos/novo`) — Wizard 5 passos
Multi-step com `useReducer`.
- **Passo 1 — Categoria:** grid de categorias para seleção
- **Passo 2 — Descrição:** textarea + upload de arquivos (múltiplos)
- **Passo 3 — Localização:** CEP com ViaCEP + data desejada
- **Passo 4 — Orçamento:** slider de faixa de preço mínimo/máximo
- **Passo 5 — Revisão:** resumo completo antes de enviar
- Submit via `cotacoesService.criar()`

---

### 3.14 Detalhe de Cotação (`/orcamentos/:id`)
- Card da cotação (status, categoria, descrição, data)
- Lista de `OrcamentoCard` de prestadores com valor, prazo e descrição
- Ações: **Aceitar** orçamento (modal de confirmação) e **Rejeitar**
- Mutations via `cotacoesService.aceitarOrcamento()` / `rejeitarOrcamento()`

---

### 3.15 Conta — Perfil (`/conta/perfil`)
Navegação lateral compartilhada entre todas as páginas de conta.
- Avatar com botão câmera para trocar foto
- Formulário React Hook Form + Zod com `usePerfil` / `useAtualizarPerfil`
- Campos: nome, email, CPF, telefone, data nascimento
- Toast de sucesso/erro no save

---

### 3.16 Conta — Senha (`/conta/senha`)
- Campos: senha atual, nova senha, confirmar nova senha
- Show/hide toggles em todos os campos
- `PasswordStrength`: indicador visual de 4 barras
- Zod: mínimo 8 chars, 1 maiúscula, 1 número, senhas coincidem
- Submit via `clientesService.alterarSenha()`

---

### 3.17 Conta — Endereços (`/conta/enderecos`)
- CRUD completo: listar, criar, editar, deletar
- Modal de formulário com ViaCEP para autopreenchimento
- Confirmação antes de deletar
- Badge "Principal" no endereço marcado como principal
- Mutations: `criarEndereco` / `atualizarEndereco` / `deletarEndereco`

---

### 3.18 Conta — Avaliações (`/conta/avaliacoes`)
- Lista de avaliações escritas pelo usuário
- Estrelas + comentário + data
- Botão de deletar com modal de confirmação
- `avaliacoesService.deletar()`

---

## 4. Componentes Globais

### TopBar
- Logo Arcaika (link para `/`)
- Campo de busca desktop (focus navega para `/marketplace`)
- Ícone carrinho com badge de contagem (Zustand `carrinhoStore`)
- Ícone perfil se autenticado → `/perfil` / Botão "Entrar" → `openLoginModal()`

### BottomNav (mobile only, `md:hidden`)
- 5 abas: Início / Buscar → `/marketplace` / Orçamentos → `/orcamentos` / Pedidos / Perfil → `/conta/perfil`
- Highlight ativo via `NavLink`

### LoginModal
- Overlay global montado no router
- Controlado por `uiStore.isLoginModalOpen`
- Fecha com ESC, clique fora, ou após login bem-sucedido
- Trava scroll do body quando aberto
- Link "Esqueci minha senha" → `/auth/recuperar-senha`

### ArkyFAB
- FAB laranja fixo, canto inferior direito
- **Escondido em `/checkout`** ✅
- Abre/fecha `ArkyDrawer`

### ArkyDrawer
- Chat em drawer flutuante (480px altura)
- Mensagens com bolhas visuais (usuário = laranja, Arky = cinza)
- **Chips de sugestão rápida** no estado vazio ✅
- **TypingIndicator animado** (3 dots bounce escalonado) ✅
- Input com debounce + botão send
- Histórico em `sessionStorage` via `useArky`

### Toast System
- Queue máxima de 3 toasts simultâneos
- Auto-dismiss em 4s (configurável)
- Tipos: success / error / warning / info

---

## 5. Serviços de API Mapeados

| Service | Endpoints cobertos |
|---------|--------------------|
| `authService` | `POST /auth/cliente/login`, `POST /auth/cliente` |
| `marketplaceService` | `GET /marketplace/`, `/categorias`, `/servicos/:id`, `/itens/:id`, `/recomendacoes` |
| `carrinhoService` | `GET/POST/DELETE /carrinho`, aplicar cupom, remover cupom |
| `pedidosService` | `GET /pedidos`, `GET /pedidos/:id`, `POST /pedidos`, `PATCH /pedidos/:id/cancelar`, checkout |
| `cotacoesService` | `GET/POST /cotacoes`, `GET /cotacoes/:id`, aceitar/rejeitar orçamento |
| `clientesService` | perfil, atualizar, senha, endereços CRUD |
| `avaliacoesService` | por serviço/organização/prestador, criar, deletar |
| `assistenteService` | `POST /assistente/mensagem` (Arky) |

---

## 6. Pendências e Gaps Conhecidos

### 🔴 Bloqueadores de produção

| Item | Detalhe |
|------|---------|
| **Build quebrado** | `@rollup/rollup-linux-x64-gnu` ausente no ambiente. `npm run build` falha; `npm run dev` e `tsc --noEmit` funcionam. Precisa de reinstalação do node_modules em ambiente com acesso pleno ao npm registry. |
| **Interceptor 401 faz hard reload** | `window.location.href = '/auth/login'` no interceptor Axios destrói o estado React. Deveria usar `navigate()` ou `authStore.logout()` + redirect via `RequireAuth`. |

### 🟠 Funcionais faltando

| Item | Detalhe |
|------|---------|
| **Página `/marketplace/item/:id`** | `marketplaceService.detalheItem()` existe, mas não há rota nem UI para detalhe de item (produto). Apenas serviços têm página de detalhe. |
| **Endereço no cadastro não é enviado** | O wizard de Cadastro coleta endereço no passo 3 mas `RegisterInput` não aceita o campo — a API atual não suporta. Quando o backend expandir, conectar o dado. |
| **RecuperarSenha depende de backend** | Endpoints `POST /auth/recuperar-senha` e `POST /auth/redefinir-senha` precisam ser implementados no backend. |
| **TopBar busca navega errado** | O campo de busca no desktop manda para `/marketplace` (onFocus). Deveria navegar para `/busca?q=termo` ao submeter. |
| **ModalAvaliacao pode ser submetida várias vezes** | Não há verificação se o pedido já foi avaliado. O backend pode rejeitar, mas a UI não desabilita o botão preventivamente. |
| **Carrinho não sincroniza com localStorage** | O badge do carrinho usa `carrinhoStore` (Zustand sem persist). Se o usuário recarregar a página, o badge some até o próximo fetch. |

### 🟡 Qualidade / UX

| Item | Detalhe |
|------|---------|
| **Marketplace usa Spinner** | Docs especificam Skeleton para estados de loading de listas, não Spinner. `Marketplace/index.tsx` usa Spinner. `Busca/index.tsx` já usa Skeleton (correto). |
| **TopBar link de perfil** | Aponta para `/perfil` (rota de compatibilidade) ao invés de `/conta/perfil` diretamente. |
| **Sem paginação real** | Marketplace e Busca têm `page_size: 20/24` fixo. Para grandes volumes, scroll infinito com `useInfiniteQuery` é necessário. |
| **Sem testes** | Zero testes unitários ou de integração. Flows prioritários para cobrir: LoginModal, wizard Cadastro, wizard Checkout, ModalAvaliacao. |
| **App.tsx não é usado** | O arquivo raiz `App.tsx` é uma casca vazia. A lógica real está em `router/index.tsx`. Pode ser removido ou consolidado. |
| **Sem ErrorBoundary global** | Erros de render em qualquer página derrubam toda a aplicação. Falta um `<ErrorBoundary>` ao redor de `<Suspense>`. |
| **Scroll restoration** | Ao navegar entre páginas, o scroll não retorna ao topo. Falta `<ScrollRestoration />` do React Router ou um hook equivalente. |

### 🔵 Expansão futura (fora do escopo atual)

- Notificações em tempo real (WebSocket / SSE) para mudança de status de pedido
- PWA com service worker e offline fallback
- Internacionalização (i18n)
- Modo escuro (a config `darkMode: 'class'` já existe no Tailwind)
- Área do prestador (painel separado — este projeto é só o cliente)

---

## 7. Resumo de Completude

| Área | Status |
|------|--------|
| Roteamento e estrutura | ✅ 100% |
| Design system / tokens | ✅ 100% |
| Autenticação (login, cadastro, recuperação) | ✅ 100% |
| Home | ✅ 100% |
| Marketplace + Busca + Detalhe | ✅ 95% (falta ItemDetalhe) |
| Carrinho | ✅ 95% (falta animate slide-out on remove) |
| Checkout wizard | ✅ 100% |
| Pedidos + Detalhe + Avaliação | ✅ 100% |
| Orçamentos wizard + Detalhe | ✅ 100% |
| Conta (perfil, senha, endereços, avaliações) | ✅ 100% |
| Arky (FAB + Drawer) | ✅ 90% (sem cards de recomendação em respostas) |
| Componentes globais (TopBar, BottomNav, LoginModal, Toast) | ✅ 95% (TopBar busca incompleta) |
| Testes | ❌ 0% |
| Build de produção | ❌ Bloqueado (rollup native addon) |

**Estimativa geral de completude do frontend: ~90%**
O restante são bugs pontuais, um caso de uso faltante (ItemDetalhe) e infraestrutura de testes/build.
