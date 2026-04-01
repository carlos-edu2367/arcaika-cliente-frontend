# Contexto de Sessão — Frontend Cliente Arcaika

Use este arquivo para iniciar sessões Claude com contexto completo do projeto. Cole o conteúdo deste arquivo no início da sessão ou inclua via `@.claude/context.md`.

---

## O que é este projeto

**Arcaika** é um marketplace de serviços. Este pacote (`frontend-cliente`) é a SPA do **usuário final** que contrata serviços, solicita orçamentos e acompanha pedidos.

Outros pacotes existem (frontend do prestador, admin, backend) mas são independentes.

---

## Stack definitiva (não discutir)

| Tecnologia | Versão |
|---|---|
| React | 18.x |
| TypeScript | 5.x (strict: true) |
| Vite | 5.x |
| React Router | 6.x |
| TanStack Query | 5.x |
| Zustand | 4.x |
| Axios | 1.x |
| React Hook Form | 7.x |
| Zod | 3.x |
| Tailwind CSS | 3.x |
| Radix UI | latest |
| DOMPurify | 3.x |

---

## Identidade visual

- **Primária (laranja):** `#F97316`
- **Hover laranja:** `#EA6C0A`
- **Texto principal:** `#111827`
- **Texto secundário:** `#6B7280`
- **Fundo:** `#FFFFFF`
- **Superfície alt:** `#F3F4F6`
- **Borda:** `#E5E7EB`
- **Fontes:** Inter (corpo), Poppins (títulos)
- **Assistente:** Arky (chat flutuante, laranja, letra "A")

---

## Estrutura de pastas (resumo)

```
src/
├── components/ui/          ← Design System: Button, Input, Card, Badge, Modal, Toast, Skeleton
├── components/layout/      ← TopBar, BottomNav, PageShell, RequireAuth
├── components/shared/      ← ServiceCard, RatingStars, AvatarUser
├── features/               ← marketplace/, auth/, carrinho/, checkout/, pedidos/, cotacoes/, conta/, arky/
│   └── [feature]/
│       ├── components/
│       ├── hooks/          ← useQuery/useMutation encapsulados
│       └── types.ts
├── pages/                  ← Componentes de página (finos, apenas orquestração)
├── stores/                 ← authStore, carrinhoStore, uiStore (Zustand)
├── lib/                    ← axios.ts, queryClient.ts, router.tsx
├── hooks/                  ← useDebounce, useScrollDirection, useLocalStorage
├── utils/                  ← formatters, validators, cn, sanitize
└── types/                  ← api.ts, global.ts
```

---

## Rotas

| Path | Auth | Página |
|---|---|---|
| `/` | Público | HomePage |
| `/marketplace` | Público | MarketplacePage (infinite scroll, filtros) |
| `/marketplace/servico/:id` | Público | ServicoDetalhePage |
| `/marketplace/item/:id` | Público | ItemDetalhePage |
| `/busca` | Público | BuscaPage |
| `/auth/login` | Público | LoginPage |
| `/auth/cadastro` | Público | CadastroPage (wizard 3 passos) |
| `/auth/recuperar-senha` | Público | RecuperarSenhaPage |
| `/carrinho` | ✅ | CarrinhoPage |
| `/checkout` | ✅ | CheckoutPage (wizard 5 passos) |
| `/pedidos` | ✅ | PedidosPage |
| `/pedidos/:id` | ✅ | PedidoDetalhePage |
| `/orcamentos` | ✅ | CotacoesPage |
| `/orcamentos/novo` | ✅ | NovaCotacaoPage (wizard 5 passos) |
| `/orcamentos/:id` | ✅ | CotacaoDetalhePage |
| `/conta/perfil` | ✅ | PerfilPage |
| `/conta/senha` | ✅ | SenhaPage |
| `/conta/enderecos` | ✅ | EnderecosPage |
| `/conta/avaliacoes` | ✅ | AvaliacoesPage |

---

## Decisões já tomadas (não reabrir)

- **SPA puro com Vite**, sem Next.js/SSR
- **localStorage** para JWT (access_token), sessionStorage para refresh_token
- **Sem Redux**: TanStack Query para server state, Zustand para UI state
- **Tailwind + Radix UI** (sem Material UI, Chakra, Ant Design)
- **React Hook Form + Zod** para todos os formulários (sem Formik)
- **Mobile-first**: BottomNav em mobile, TopBar em desktop
- **Sem spinners em listas**: usar Skeleton screens
- **DOMPurify** obrigatório em qualquer `dangerouslySetInnerHTML`
- **Português brasileiro** em toda a UI
- **Arky** requer login; sem login abre ModalLogin

---

## React Query Keys (convenção)

```
['marketplace', 'servicos', { filtros }]   ← listagem
['marketplace', 'servicos', id]            ← detalhe
['marketplace', 'categorias']
['carrinho']
['pedidos']                                ← lista
['pedidos', id]                            ← detalhe
['cotacoes']
['cotacoes', id]
['cotacoes', id, 'orcamentos']
['clientes', 'me']
['clientes', 'me', 'enderecos']
['avaliacoes', tipo, id]
```

---

## Zustand Stores

- **`authStore`**: `user`, `token`, `isAuthenticated`, `setAuth()`, `logout()`
- **`carrinhoStore`**: `count` (badge), `setCount()`, `incrementCount()`
- **`uiStore`**: `theme`, `isArkyOpen`, `isLoginModalOpen`, `loginModalMessage`

---

## Links para documentação completa

| Doc | Link |
|---|---|
| Índice | [docs/00-indice.md](../docs/00-indice.md) |
| Arquitetura | [docs/01-arquitetura.md](../docs/01-arquitetura.md) |
| Design System | [docs/02-design-system.md](../docs/02-design-system.md) |
| Páginas e Rotas | [docs/03-paginas-e-rotas.md](../docs/03-paginas-e-rotas.md) |
| Wizards | [docs/04-wizards.md](../docs/04-wizards.md) |
| Performance | [docs/05-performance.md](../docs/05-performance.md) |
| Estado e API | [docs/06-estado-e-api.md](../docs/06-estado-e-api.md) |
| Arky | [docs/07-arky-assistente.md](../docs/07-arky-assistente.md) |
| Mobile First | [docs/08-mobile-first.md](../docs/08-mobile-first.md) |
| Segurança | [docs/09-seguranca.md](../docs/09-seguranca.md) |
| UX Flows | [docs/10-ux-flows.md](../docs/10-ux-flows.md) |

---

## TODOs de implementação (fase 1)

- [ ] Scaffolding inicial: `npm create vite@latest`, configurar TypeScript strict, Tailwind, aliases
- [ ] Instalar e configurar todas as dependências da stack
- [ ] Implementar Design System base (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Toast`, `Skeleton`)
- [ ] Configurar Axios com interceptors (`lib/axios.ts`)
- [ ] Configurar QueryClient com defaults (`lib/queryClient.ts`)
- [ ] Implementar roteamento completo (`lib/router.tsx`) com lazy loading
- [ ] Implementar stores Zustand: `authStore`, `carrinhoStore`, `uiStore`
- [ ] Implementar `RequireAuth` e layouts base (`TopBar`, `BottomNav`, `PageShell`)
- [ ] Implementar fluxo de auth: Login, Cadastro (wizard), RecuperarSenha
- [ ] Implementar Marketplace: listagem + filtros + detalhe de serviço
- [ ] Implementar Carrinho com optimistic updates
- [ ] Implementar Checkout wizard (5 passos)
- [ ] Implementar Pedidos: lista + detalhe + timeline
- [ ] Implementar Cotações: lista + wizard de criação + detalhe + aceitar/rejeitar
- [ ] Implementar área de Conta: perfil, senha, endereços, avaliações
- [ ] Implementar Arky: FAB, drawer, chat, integração API

## TODOs de fase 2 (após MVP)

- [ ] Dark mode completo
- [ ] PWA manifest + ícones
- [ ] Service Worker com Workbox
- [ ] Pull-to-refresh em listas
- [ ] Swipe gesture em drawers
- [ ] Notificações push (quando prestador responde orçamento)
- [ ] Tour de onboarding (ModalOnboarding)
- [ ] Lighthouse CI automatizado no pipeline
