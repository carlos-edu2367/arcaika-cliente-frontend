# UX/UI Audit Findings — frontend-cliente

## Achados Arquiteturais

### Auth + Arky
- Arky requer autenticação — o endpoint `/assistente/chat` retorna 401 para usuários não logados.
- O `ArkyFAB` agora guarda autenticação antes de abrir o drawer.
- Histórico do Arky em `sessionStorage` (chave: `arcaika_arky_history`) deve ser limpo no logout (já implementado em `authStore.ts`).

### Safe Area Mobile
- A classe `safe-bottom` já existe em `src/index.css` com `padding-bottom: env(safe-area-inset-bottom)`.
- `BottomNav` usa `safe-bottom` para preencher o home indicator em iPhones.
- `PageWrapper` usa `pb-20` (80px) que cobre nav (~60px) + buffer de safe area.

### Proteção de Rotas no BottomNav
- Itens protegidos do BottomNav: Orçamentos (`/conta/orcamentos`), Pedidos (`/conta/pedidos`), Perfil (`/conta/perfil`).
- Estes interceptam click via `onClick` no `NavLink` e abrem `openLoginModal()`.
- `isActive` nos NavLinks protegidos só aplica quando `isAuthenticated` é true.

### Segurança — DOMPurify
- `DOMPurify` está disponível no projeto (`dompurify@^3.0.11`).
- Deve ser usado em qualquer renderização de HTML/Markdown de origem do backend.
- Já aplicado em `ArkyDrawer.tsx`.

### Tipagem
- `PedidoDetalhe.tsx` usa `(pedido as any).linhas` e `(items: any)` — áreas de fraqueza de tipagem.
- Tipos do domínio têm `status` definido mas `PedidoDetalhe` usa comparações de string com ambos maiúsculas e minúsculas.

## Padrões Confirmados

- Estado de auth: `isAuthenticated + token` (token nunca persiste em localStorage).
- Refresh token: via cookie HTTP-only, não via payload.
- Query cache: TanStack Query v5 com staleTime 5min.
- Zustand stores: `authStore`, `carrinhoStore`, `locationStore`, `uiStore`.
- Cada store tem sua própria chave localStorage (ex: `arcaika_auth`, `arcaika_carrinho_count`, `arcaika_location`).
- SessionStorage: somente Arky history (`arcaika_arky_history`).
