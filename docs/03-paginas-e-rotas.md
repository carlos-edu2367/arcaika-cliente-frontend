# 03 — Páginas e Rotas

Cada rota está documentada com: path, título da aba, requisito de autenticação, componentes principais, dados carregados (endpoints), e notas de UX.

---

## Estrutura de roteamento

```
<RouterProvider>
  <RootLayout>                    ← TopBar + BottomNav + Toaster
    /                             ← HomePage
    /marketplace                  ← MarketplacePage
    /marketplace/servico/:id      ← ServicoDetalhePage
    /marketplace/item/:id         ← ItemDetalhePage
    /busca                        ← BuscaPage
    /auth/login                   ← LoginPage (redireciona se já logado)
    /auth/cadastro                ← CadastroPage (redireciona se já logado)
    /auth/recuperar-senha         ← RecuperarSenhaPage
    <RequireAuth>                 ← wrapper que redireciona para /auth/login
      /carrinho                   ← CarrinhoPage
      /checkout                   ← CheckoutPage
      /pedidos                    ← PedidosPage
      /pedidos/:id                ← PedidoDetalhePage
      /orcamentos                 ← CotacoesPage
      /orcamentos/novo            ← NovaCotacaoPage
      /orcamentos/:id             ← CotacaoDetalhePage
      /conta/perfil               ← PerfilPage
      /conta/senha                ← SenhaPage
      /conta/enderecos            ← EnderecosPage
      /conta/avaliacoes           ← AvaliacoesPage
    </RequireAuth>
    *                             ← NotFoundPage
  </RootLayout>
</RouterProvider>
```

---

## `/` — Home / Landing

| Campo | Valor |
|---|---|
| **Título da aba** | `Arcaika — Encontre os melhores serviços` |
| **Auth** | Público |
| **Endpoint principal** | `GET /marketplace/recomendacoes`, `GET /marketplace/categorias` |

**Seções da página (top to bottom):**

1. **Hero**: gradiente laranja→branco, título grande em Poppins ("Encontre o serviço certo para você"), campo de busca por texto/localidade, botão "Buscar" primário.
2. **Categorias em destaque**: grid horizontal scrollável no mobile, grid 4 colunas no desktop. Chips com ícone + nome de categoria. Dado: `GET /marketplace/categorias`.
3. **Serviços populares**: carrossel horizontal (3 cards visíveis no mobile, 4 no desktop). Dado: `GET /marketplace/recomendacoes`.
4. **Como funciona**: 3 steps ilustrados (Buscar → Contratar → Avaliar). Estático.
5. **CTA de cadastro**: bloco laranja com título "Comece agora" e botão "Criar conta grátis" → `/auth/cadastro`.
6. **Footer**: links legais, redes sociais, logo.

**UX notes:**
- Hero não tem imagem de fundo (evita CLS); usa gradiente CSS para carregamento instantâneo.
- O campo de busca do hero ao ser submetido navega para `/busca?q=termo&localidade=cidade`.
- `GET /marketplace/recomendacoes` é prefetchado no QueryClient na inicialização do app (dados disponíveis antes do usuário chegar à home).
- StaleTime de `/marketplace/recomendacoes` na home: 10 minutos (dado semi-estático).

---

## `/marketplace` — Listagem do Marketplace

| Campo | Valor |
|---|---|
| **Título da aba** | `Marketplace — Arcaika` |
| **Auth** | Público |
| **Endpoints** | `GET /marketplace/?localidade=&categoria=&preco_min=&preco_max=&pagina=` |

**Layout:** sidebar de filtros à esquerda (desktop) / drawer de filtros (mobile) + grid de cards à direita.

**Componentes principais:**
- `FilterSidebar` / `FilterDrawer`: filtros de localidade, categoria (checkboxes), faixa de preço (slider range), ordenação (select).
- `ServiceCard`: card com imagem, nome do serviço, nome da organização/prestador, preço a partir de, badge de avaliação média, badge de distância.
- `InfiniteScrollList`: carrega próxima página quando o último card entra no viewport (Intersection Observer).
- `ActiveFiltersBar`: chips removíveis dos filtros ativos, abaixo da barra de busca.

**UX notes:**
- Filtros são refletidos na URL (`/marketplace?categoria=limpeza&localidade=SP`), permitindo compartilhamento de link com filtros.
- Ao mudar filtro, a lista faz skeleton por 200ms mínimo (evita flash de conteúdo).
- No mobile, o botão "Filtrar" no topo abre o `FilterDrawer` (slide-up da base da tela).
- Prefetch do detalhe de serviço ao hover de 500ms no card (desktop) via `queryClient.prefetchQuery`.
- Infinite scroll com `useInfiniteQuery` do TanStack Query; cada página traz 20 itens.
- Estado de "sem resultados" mostra ilustração + sugestão de alargar filtros.

---

## `/marketplace/servico/:id` — Detalhe de Serviço

| Campo | Valor |
|---|---|
| **Título da aba** | `[Nome do Serviço] — Arcaika` |
| **Auth** | Público (ver/ler); login necessário para contratar |
| **Endpoints** | `GET /marketplace/servicos/:id`, `GET /avaliacoes/servico/:id` |

**Componentes principais:**
- `ImageGallery`: carrossel de imagens do serviço com thumbnails. No mobile: swipe horizontal.
- `ServiceInfo`: nome, categoria (Badge), descrição completa (sanitizada com DOMPurify), preço.
- `ProviderCard`: mini-card do prestador/organização com avatar, nome, rating, botão "Ver perfil".
- `ReviewsList`: lista paginada de avaliações com RatingStars + texto + data.
- `RatingSummary`: média geral + distribuição por estrelas (barras de progresso).
- `ContratarCTA`: sticky no mobile (fixed bottom bar), fixo na sidebar direita no desktop. Botão "Contratar" (→ carrinho → checkout) e botão "Solicitar orçamento" (→ `/orcamentos/novo`).

**UX notes:**
- Se usuário não está logado e clica "Contratar": abre `ModalLogin` com mensagem "Faça login para contratar este serviço". Após login, retorna para a mesma página e repete a ação.
- A intenção do usuário antes do login é salva em `sessionStorage` (`arcaika:pendingAction`) para ser executada após autenticação.
- "Adicionar ao carrinho" dá feedback imediato: ícone do carrinho na TopBar anima (+1), toast de sucesso.
- Avaliações carregam em scroll (lazy): as 5 primeiras junto com o serviço, restante sob demanda.

---

## `/marketplace/item/:id` — Detalhe de Item/Produto

| Campo | Valor |
|---|---|
| **Título da aba** | `[Nome do Item] — Arcaika` |
| **Auth** | Público |
| **Endpoints** | `GET /marketplace/itens/:id` |

**Estrutura similar à de serviço**, com diferenças:
- Exibe estoque disponível (Badge verde/vermelho).
- Sem campo de data/horário preferencial no CTA.
- Preço fixo (sem faixa de orçamento).

---

## `/busca` — Resultados de Busca

| Campo | Valor |
|---|---|
| **Título da aba** | `Busca: "[termo]" — Arcaika` |
| **Auth** | Público |
| **Endpoints** | `GET /marketplace/?q=&localidade=&categoria=` |

**Comportamento:** lê query params `q`, `localidade`, `categoria` da URL. Exibe resultados mistos (serviços + itens) ou filtrados por tipo.

**UX notes:**
- Campo de busca no topo já preenchido com o termo da URL.
- Debounce de 300ms: ao digitar no campo de busca, atualiza a URL e recarrega resultados.
- "Você quis dizer...?" para termos com typos (implementação futura, placeholder no layout).

---

## `/auth/login` — Login

| Campo | Valor |
|---|---|
| **Título da aba** | `Entrar — Arcaika` |
| **Auth** | Público (redireciona logado para `/`) |
| **Endpoints** | `POST /auth/cliente/login` |

**Componentes:**
- `LoginForm`: email + senha + botão "Entrar" + link "Esqueci minha senha" + link "Criar conta".
- Feedback de erro inline (422: "Email ou senha incorretos").
- Rate limit visual: após 5 tentativas, mostra contador regressivo de 60s.

**UX notes:**
- Após login bem-sucedido, redireciona para `location.state.from` (URL que o usuário tentava acessar) ou `/` como fallback.
- "Lembrar de mim": checkbox que estende expiração do token de 1h para 7 dias (implementação via refresh token de longa duração).

---

## `/auth/cadastro` — Cadastro

| Campo | Valor |
|---|---|
| **Título da aba** | `Criar conta — Arcaika` |
| **Auth** | Público |
| **Endpoints** | `POST /auth/cliente` |

Wizard de 3 passos. Ver detalhes em [04 — Wizards](04-wizards.md#wizard-3--cadastro-de-cliente).

---

## `/auth/recuperar-senha` — Recuperação de Senha

| Campo | Valor |
|---|---|
| **Título da aba** | `Recuperar senha — Arcaika` |
| **Auth** | Público |

**Fluxo:** Email → (email enviado) → Link no email → Nova senha → Confirmação.

**Componentes:** `RecuperarSenhaForm` (passo 1: email), `NovaSenhaForm` (passo 2: nova senha + confirmar, ativado pelo token da URL).

---

## `/carrinho` — Carrinho

| Campo | Valor |
|---|---|
| **Título da aba** | `Carrinho — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /carrinho/`, `DELETE /carrinho/itens/:id`, `POST /carrinho/cupom`, `DELETE /carrinho/cupom` |

**Componentes:**
- `CarrinhoItem`: imagem, nome, preço unitário, quantidade (stepper), botão remover.
- `CarrinhoServico`: similar, mas com data/horário preferencial selecionável.
- `ResumoCarrinho`: subtotal, desconto de cupom, total. Sticky no desktop (sidebar direita), fixo no bottom no mobile.
- `CupomInput`: campo de código + botão "Aplicar". Feedback imediato de válido/inválido.

**UX notes:**
- Remoção de item tem animação de slide-out para a direita.
- Carrinho vazio mostra ilustração + botão "Explorar serviços" → `/marketplace`.
- Optimistic update: ao remover item, o UI atualiza imediatamente; se a API falhar, reverte e mostra toast de erro.

---

## `/checkout` — Checkout

| Campo | Valor |
|---|---|
| **Título da aba** | `Finalizar pedido — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `POST /pedidos/`, `POST /pedidos/:id/pagamento`, `GET /clientes/me/enderecos` |

Wizard de 5 passos. Ver detalhes em [04 — Wizards](04-wizards.md#wizard-1--contratar-serviço-checkout).

---

## `/pedidos` — Histórico de Pedidos

| Campo | Valor |
|---|---|
| **Título da aba** | `Meus pedidos — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /pedidos/` |

**Componentes:**
- `PedidoCard`: número do pedido, serviço(s), data, valor total, `StatusBadge`.
- Filtro de status (tabs): "Todos", "Em andamento", "Concluídos", "Cancelados".

**UX notes:** staleTime de 1 minuto (dados mudam com frequência moderada). Refetch automático quando a aba volta ao foco.

---

## `/pedidos/:id` — Detalhe do Pedido

| Campo | Valor |
|---|---|
| **Título da aba** | `Pedido #[id] — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /pedidos/:id` |

**Componentes:**
- `TimelinePedido`: linha do tempo vertical com os eventos do pedido (criado, confirmado, em execução, concluído / cancelado).
- `ItensPedido`: lista dos itens/serviços com valores.
- `InformacoesPagamento`: método de pagamento, status do pagamento.
- `BotaoCancelar`: visível apenas se status permite cancelamento; abre `ModalConfirmacao`.
- `BotaoAvaliar`: visível após conclusão; navega para flow de avaliação.

---

## `/orcamentos` — Solicitações de Orçamento

| Campo | Valor |
|---|---|
| **Título da aba** | `Meus orçamentos — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /cotacoes/`, `GET /cotacoes/aceitos` |

**Tabs:** "Aguardando propostas", "Com propostas", "Aceitos", "Encerrados".

**Componentes:**
- `CotacaoCard`: título da cotação, categoria, data, número de propostas recebidas, StatusBadge.

---

## `/orcamentos/novo` — Solicitar Orçamento

| Campo | Valor |
|---|---|
| **Título da aba** | `Solicitar orçamento — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `POST /cotacoes/` |

Wizard de 5 passos. Ver detalhes em [04 — Wizards](04-wizards.md#wizard-2--solicitar-orçamento).

---

## `/orcamentos/:id` — Detalhe de Cotação

| Campo | Valor |
|---|---|
| **Título da aba** | `Cotação #[id] — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /cotacoes/:id`, `GET /cotacoes/:id/orcamentos/:oid`, `PUT /cotacoes/:id/orcamentos/:oid/aceitar`, `PUT /cotacoes/:id/orcamentos/:oid/rejeitar` |

**Componentes:**
- `CotacaoInfo`: descrição, categoria, localidade, data desejada, orçamento estimado.
- `OrcamentoCard`: proposta de um prestador — valor, descrição, prazo, rating do prestador, botões "Aceitar" / "Rejeitar".
- `ModalAceitarOrcamento`: confirmação antes de aceitar (ação irreversível).

---

## `/conta/perfil` — Editar Perfil

| Campo | Valor |
|---|---|
| **Título da aba** | `Meu perfil — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /clientes/me`, `PUT /clientes/me` |

**Componentes:** `PerfilForm` (nome, email, telefone, CPF read-only, data de nascimento), `AvatarUpload`.

---

## `/conta/senha` — Alterar Senha

| Campo | Valor |
|---|---|
| **Título da aba** | `Alterar senha — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `POST /clientes/me/alterar-senha` |

**Componentes:** `AlterarSenhaForm` (senha atual + nova senha + confirmar nova senha). Validação: nova senha ≥ 8 caracteres, 1 maiúscula, 1 número.

---

## `/conta/enderecos` — Gerenciar Endereços

| Campo | Valor |
|---|---|
| **Título da aba** | `Meus endereços — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /clientes/me/enderecos/:id`, `POST /clientes/me/enderecos/:id`, `PUT /clientes/me/enderecos/:id`, `DELETE /clientes/me/enderecos/:id` |

**Componentes:** `EnderecoCard` (com ações editar/excluir), `EnderecoForm` (modal), botão "Adicionar endereço".

**UX notes:** preenchimento automático via CEP (API pública de CEP); campos de rua, bairro, cidade e estado preenchidos ao digitar o CEP válido.

---

## `/conta/avaliacoes` — Avaliações Feitas

| Campo | Valor |
|---|---|
| **Título da aba** | `Minhas avaliações — Arcaika` |
| **Auth** | Obrigatório |
| **Endpoints** | `GET /avaliacoes/servico/:id`, `DELETE /avaliacoes/:id` |

**Componentes:** lista de `AvaliacaoCard` (serviço avaliado, estrelas, comentário, data). Ação de excluir avaliação com confirmação.
