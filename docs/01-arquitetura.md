# 01 — Arquitetura do Frontend Cliente

## Visão geral

O `frontend-cliente` é uma **Single Page Application (SPA)** construída com React 18 e servida como assets estáticos. Não há SSR. O backend é consumido exclusivamente via API REST com autenticação JWT.

A escolha por SPA puro (sem Next.js) é justificada porque:
- O conteúdo do marketplace não exige indexação por crawler para SEO crítico (a indexação pública pode ser tratada com prerender estático ou sitemap futuro)
- Simplifica deploy: qualquer CDN ou bucket S3 serve os assets
- Reduz complexidade operacional: sem servidor Node.js em produção
- A experiência de app nativo (transições, estado persistente) é prioridade maior que SEO na fase atual

---

## Stack e justificativas

| Tecnologia | Versão | Justificativa |
|---|---|---|
| **Vite** | 5.x | Build extremamente rápido em dev (HMR instantâneo), esbuild para transformação, Rollup para bundle de produção |
| **React** | 18.x | Concurrent features (Suspense, useTransition) para UX fluida; ecossistema maduro |
| **TypeScript** | 5.x | Segurança de tipos em contratos de API, props de componentes e stores |
| **React Router** | 6.x | Roteamento declarativo, data loaders, nested routes para layouts aninhados |
| **TanStack Query** | 5.x | Cache inteligente de server state, deduplicação de requests, refetch automático, optimistic updates |
| **Zustand** | 4.x | Store global mínimo para auth/UI; API simples sem boilerplate Redux |
| **Axios** | 1.x | Interceptors para injeção de token e tratamento de erro centralizado |
| **React Hook Form** | 7.x | Performance em formulários (sem re-render a cada tecla), integração nativa com Zod |
| **Zod** | 3.x | Validação de schemas com inferência TypeScript automática; valida também respostas da API |
| **Tailwind CSS** | 3.x | Utility-first elimina CSS morto, mobile-first por padrão, integração total com Radix |
| **Radix UI** | latest | Primitivos acessíveis (Dialog, Popover, Select, Toast) sem estilos impostos |
| **DOMPurify** | 3.x | Sanitiza HTML de descrições de serviços vindas da API para prevenir XSS |

---

## Estrutura de pastas (`src/`)

```
src/
├── assets/                  # Imagens estáticas, SVGs, fontes locais
│   ├── icons/
│   └── images/
│
├── components/              # Componentes reutilizáveis (Design System)
│   ├── ui/                  # Átomos: Button, Input, Badge, Spinner, Skeleton...
│   ├── layout/              # Estruturas: TopBar, BottomNav, Sidebar, PageShell
│   ├── feedback/            # Toast, ErrorBoundary, EmptyState, LoadingPage
│   └── shared/              # Compostos reutilizáveis: ServiceCard, AvatarUser, RatingStars
│
├── features/                # Módulos de domínio (feature slices)
│   ├── marketplace/         # Listagem, detalhe de serviço, detalhe de item
│   │   ├── components/      # ServiceCard, FilterSidebar, CategoryChip
│   │   ├── hooks/           # useMarketplace, useServico, useItem
│   │   └── types.ts         # Servico, Item, Categoria, FiltrosMarketplace
│   │
│   ├── auth/                # Login, cadastro, recuperação de senha
│   │   ├── components/      # LoginForm, CadastroWizard, RecuperarSenhaForm
│   │   ├── hooks/           # useAuth, useLogin, useCadastro
│   │   └── types.ts         # TokenPayload, LoginPayload, CadastroPayload
│   │
│   ├── carrinho/            # Estado e UI do carrinho
│   │   ├── components/      # CarrinhoDrawer, CarrinhoItem, CupomInput
│   │   ├── hooks/           # useCarrinho
│   │   └── types.ts         # Carrinho, ItemCarrinho, Cupom
│   │
│   ├── checkout/            # Wizard de finalização de pedido
│   │   ├── components/      # CheckoutWizard, StepPagamento, StepEndereco...
│   │   ├── hooks/           # useCheckout, usePagamento
│   │   └── types.ts         # PedidoPayload, MetodoPagamento
│   │
│   ├── pedidos/             # Histórico e detalhe de pedidos
│   │   ├── components/      # PedidoCard, TimelinePedido, StatusBadge
│   │   ├── hooks/           # usePedidos, usePedido
│   │   └── types.ts         # Pedido, StatusPedido
│   │
│   ├── cotacoes/            # Solicitações de orçamento e propostas
│   │   ├── components/      # CotacaoCard, OrcamentoCard, OrcamentoWizard
│   │   ├── hooks/           # useCotacoes, useCotacao, useOrcamentos
│   │   └── types.ts         # Cotacao, Orcamento, StatusCotacao
│   │
│   ├── conta/               # Perfil, senha, endereços, avaliações
│   │   ├── components/      # PerfilForm, EnderecoForm, AvaliacaoCard
│   │   ├── hooks/           # useCliente, useEnderecos, useAvaliacoes
│   │   └── types.ts         # Cliente, Endereco, Avaliacao
│   │
│   └── arky/                # Assistente de IA
│       ├── components/      # ArkyButton, ArkyDrawer, MensagemChat, TypingIndicator
│       ├── hooks/           # useArky
│       └── types.ts         # MensagemArky, RespostaArky
│
├── hooks/                   # Hooks genéricos (não pertencem a uma feature)
│   ├── useDebounce.ts
│   ├── useIntersectionObserver.ts
│   ├── useLocalStorage.ts
│   └── useScrollDirection.ts
│
├── lib/                     # Configurações de bibliotecas externas
│   ├── axios.ts             # Instância configurada com interceptors
│   ├── queryClient.ts       # QueryClient com defaults globais
│   └── router.tsx           # Definição de todas as rotas
│
├── pages/                   # Componentes de página (mapeiam 1:1 com rotas)
│   ├── HomePage.tsx
│   ├── MarketplacePage.tsx
│   ├── ServicoDetalhePage.tsx
│   ├── ItemDetalhePage.tsx
│   ├── BuscaPage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── CadastroPage.tsx
│   │   └── RecuperarSenhaPage.tsx
│   ├── carrinho/
│   │   └── CarrinhoPage.tsx
│   ├── checkout/
│   │   └── CheckoutPage.tsx
│   ├── pedidos/
│   │   ├── PedidosPage.tsx
│   │   └── PedidoDetalhePage.tsx
│   ├── cotacoes/
│   │   ├── CotacoesPage.tsx
│   │   ├── NovaCotacaoPage.tsx
│   │   └── CotacaoDetalhePage.tsx
│   ├── conta/
│   │   ├── PerfilPage.tsx
│   │   ├── SenhaPage.tsx
│   │   ├── EnderecosPage.tsx
│   │   └── AvaliacoesPage.tsx
│   └── errors/
│       ├── NotFoundPage.tsx
│       └── ServerErrorPage.tsx
│
├── stores/                  # Zustand stores globais
│   ├── authStore.ts         # user, token, isAuthenticated, actions
│   ├── carrinhoStore.ts     # count (badge), actions de invalidação
│   └── uiStore.ts           # modais abertos, tema, toast queue
│
├── types/                   # Tipos globais e utilitários de tipo
│   ├── api.ts               # ApiResponse<T>, ApiError, PaginatedResponse<T>
│   └── global.ts            # Tipos de env, globals de janela
│
├── utils/                   # Funções puras utilitárias
│   ├── formatters.ts        # formatarMoeda, formatarData, formatarTelefone
│   ├── validators.ts        # validarCPF, validarCEP
│   └── cn.ts                # Merge de classes Tailwind (clsx + twMerge)
│
├── App.tsx                  # Provider root (QueryClientProvider, RouterProvider, Toaster)
├── main.tsx                 # Entry point do Vite
└── vite-env.d.ts            # Tipos de import.meta.env
```

### Regras de organização

1. **Nenhuma feature importa de outra feature diretamente.** Se há lógica compartilhada, ela sobe para `components/shared/`, `hooks/` ou `utils/`.
2. **Pages são finas.** Não contêm lógica de negócio: apenas montam layout e delegam para componentes de feature.
3. **Hooks são a camada de dados.** Componentes não chamam Axios diretamente; usam hooks que encapsulam TanStack Query ou Zustand.
4. **Tipos ficam no arquivo `types.ts` da feature ou em `types/` se globais.** Nunca inline em componentes.

---

## Fluxo de dados

```
API REST (backend)
      │
      ▼
  Axios (lib/axios.ts)         ← interceptors: injeta token, lida com 401
      │
      ▼
  TanStack Query               ← cache, deduplicação, staleTime, refetch
  (queryClient.ts)
      │
      ├── useQuery / useMutation  (dentro dos hooks de feature)
      │
      ▼
  Hook de Feature              ← ex: useMarketplace(), useCarrinho()
  (features/*/hooks/)
      │
      ▼
  Componente React             ← recebe dados tipados, sem saber de HTTP
      │
      ▼
  UI renderizada
```

**Estado de UI** (modais, theme, toast) flui pelo Zustand store → hooks de seletor → componente.

**Estado de auth** flui pelo `authStore` (Zustand) → `RequireAuth` wrapper → páginas protegidas.

---

## Estratégia de autenticação

### Opção adotada: `localStorage` + interceptor de retry

O JWT de acesso é armazenado no `localStorage` sob a chave `arcaika:token`. Esta escolha é pragmática para SPA puro sem backend Node intermediário:

- **httpOnly cookie** seria ideal para XSS, mas exige que o backend retorne o cookie com `SameSite=Strict`, o que cria complicações de CORS em desenvolvimento e para apps mobile web.
- Com localStorage, a mitigação de XSS é feita via **CSP headers** no servidor de assets, **DOMPurify** em qualquer HTML renderizado, e auditoria de dependências (`npm audit`).

**Fluxo de token:**
1. `POST /auth/cliente/login` retorna `{ access_token, refresh_token, expires_in }`
2. `access_token` é salvo no `authStore` (Zustand) e persistido no `localStorage`
3. `refresh_token` é salvo em `sessionStorage` (não persiste entre abas)
4. Interceptor do Axios injeta `Authorization: Bearer <token>` em toda request
5. Em resposta 401, o interceptor tenta refresh uma vez; se falhar, chama `authStore.logout()` e redireciona para `/auth/login`

---

## Code splitting e lazy loading

Todas as rotas são carregadas com `React.lazy`:

```
// lib/router.tsx (estrutura conceitual)
const HomePage           = lazy(() => import('@/pages/HomePage'))
const MarketplacePage    = lazy(() => import('@/pages/MarketplacePage'))
const ServicoDetalhePage = lazy(() => import('@/pages/ServicoDetalhePage'))
const CheckoutPage       = lazy(() => import('@/pages/checkout/CheckoutPage'))
// ... etc
```

Cada rota fica em seu próprio chunk. O React Router v6 com `<Suspense fallback={<PageSkeleton />}>` garante que o fallback apareça enquanto o chunk carrega.

### Chunks esperados

| Chunk | Tamanho estimado (gzip) | Trigger |
|---|---|---|
| `vendor-react` | ~45kb | sempre |
| `vendor-query` | ~15kb | sempre |
| `vendor-router` | ~12kb | sempre |
| `home` | ~8kb | rota `/` |
| `marketplace` | ~20kb | rota `/marketplace*` |
| `checkout` | ~18kb | rota `/checkout` |
| `auth` | ~12kb | rotas `/auth/*` |
| `conta` | ~10kb | rotas `/conta/*` |
| `arky` | ~6kb | usuário logado |

**Budget total initial load (vendor + home): < 200kb gzipped**

---

## Configuração TypeScript

```jsonc
// tsconfig.json (valores relevantes)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

O alias `@/` elimina imports relativos frágeis (`../../components/ui/Button`).
