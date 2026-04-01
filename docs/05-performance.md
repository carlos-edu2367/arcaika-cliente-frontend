# 05 — Performance

Performance não é um requisito de fase final — é uma restrição de arquitetura que guia decisões desde o início. Este documento define metas, estratégias e implementações específicas.

---

## Metas (Lighthouse / Web Vitals)

| Métrica | Target | Crítico (abaixo disso = bloqueio de deploy) |
|---|---|---|
| **Performance Score** (Lighthouse) | ≥ 90 | < 75 |
| **Accessibility Score** (Lighthouse) | ≥ 95 | < 90 |
| **Best Practices** (Lighthouse) | ≥ 90 | — |
| **SEO Score** (Lighthouse) | ≥ 85 | — |
| **LCP** (Largest Contentful Paint) | < 2.5s | > 4s |
| **FID / INP** (Interaction to Next Paint) | < 100ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| **TTFB** (Time to First Byte) | < 400ms | — |
| **Initial JS bundle (gzipped)** | < 200kb | > 300kb |

---

## TanStack Query — Configuração de Cache

### staleTime por tipo de dado

`staleTime` define por quanto tempo dados são considerados "frescos" e **não geram refetch** ao montar o componente.

| Endpoint / Dado | staleTime | gcTime (garbage collect) | Justificativa |
|---|---|---|---|
| `GET /marketplace/categorias` | 30 minutos | 1 hora | Muda raramente |
| `GET /marketplace/recomendacoes` | 10 minutos | 30 minutos | Semi-estático |
| `GET /marketplace/` (listagem) | 5 minutos | 15 minutos | Muda com moderação |
| `GET /marketplace/servicos/:id` | 5 minutos | 15 minutos | Detalhe estável |
| `GET /marketplace/itens/:id` | 5 minutos | 15 minutos | Detalhe estável |
| `GET /avaliacoes/servico/:id` | 5 minutos | 15 minutos | Avaliações não mudam com frequência |
| `GET /pedidos/` | 1 minuto | 5 minutos | Muda com frequência |
| `GET /pedidos/:id` | 1 minuto | 5 minutos | Status atualiza |
| `GET /cotacoes/` | 2 minutos | 10 minutos | Propostas chegam com delay |
| `GET /cotacoes/:id` | 1 minuto | 5 minutos | Aguardando proposta |
| `GET /carrinho/` | 30 segundos | 2 minutos | Altamente mutável |
| `GET /clientes/me` | 5 minutos | 15 minutos | Perfil raramente muda |
| `GET /clientes/me/enderecos/:id` | 5 minutos | 15 minutos | Raramente muda |

**Configuração global no `queryClient.ts`:**
```
defaultOptions: {
  queries: {
    staleTime: 2 * 60 * 1000,    // 2 minutos como padrão global
    gcTime: 10 * 60 * 1000,      // 10 minutos
    retry: 2,                     // 2 tentativas em erro de rede
    refetchOnWindowFocus: true,   // refetch ao voltar para a aba
  }
}
```

### Prefetch em hover de cards

No desktop, ao passar o mouse sobre um `ServiceCard` por mais de 400ms, prefetchamos o detalhe do serviço:

```
// ServiceCard.tsx (conceitual)
onMouseEnter: () => {
  setTimeout(() => {
    queryClient.prefetchQuery({
      queryKey: ['marketplace', 'servicos', servico.id],
      queryFn: () => api.get(`/marketplace/servicos/${servico.id}`),
      staleTime: 5 * 60 * 1000,
    })
  }, 400)
}
```

Resultado: quando o usuário clica e navega para o detalhe, os dados já estão em cache — a página carrega instantaneamente.

### Cache invalidation strategy

| Evento | Cache invalidado |
|---|---|
| Item adicionado ao carrinho | `['carrinho']` |
| Item removido do carrinho | `['carrinho']` |
| Cupom aplicado/removido | `['carrinho']` |
| Pedido finalizado | `['carrinho']`, `['pedidos']` |
| Perfil atualizado | `['clientes', 'me']` |
| Endereço adicionado/editado/removido | `['clientes', 'me', 'enderecos']` |
| Avaliação enviada | `['avaliacoes', tipo, id]` |
| Cotação aceita/rejeitada | `['cotacoes']`, `['cotacoes', cotacao_id]` |

Invalidação via `queryClient.invalidateQueries({ queryKey: ['carrinho'] })` após mutações bem-sucedidas.

---

## Optimistic Updates

### Carrinho

Ao adicionar/remover item do carrinho, a UI atualiza **antes** da resposta da API:

1. `onMutate`: captura o estado anterior do cache, atualiza otimisticamente
2. `onError`: reverte para o estado anterior (`context.previousData`)
3. `onSettled`: invalida o cache para sincronizar com o servidor

Componentes impactados: `carrinhoStore.count` (badge na TopBar), `CarrinhoItem` (lista).

---

## Rate Limiting no Client

### Debounce em buscas

O campo de busca no `/marketplace` e na TopBar usa debounce de **300ms**:

```
// useDebounce.ts
const debouncedQuery = useDebounce(searchInput, 300)
// O useEffect que faz o fetch só executa quando debouncedQuery muda
```

Evita disparar uma request por tecla digitada.

### Throttle em scroll

Listeners de scroll (para hide/show da TopBar, para infinite scroll) são throttleados em **100ms**:

```
useScrollDirection({ throttleMs: 100 })
```

### Limite de tentativas de login

Após 5 tentativas de login falhas, um cooldown de 60 segundos é aplicado no frontend:

- O contador é armazenado em `sessionStorage` com timestamp
- Um countdown visual aparece abaixo do botão "Entrar"
- O botão fica desabilitado durante o cooldown

---

## Otimização de Imagens

### Lazy loading

Todas as imagens fora do viewport inicial usam `loading="lazy"`:
```
<img src={servico.imagem} loading="lazy" alt={servico.nome} />
```

A primeira imagem visível no LCP (hero, primeiro card) usa `loading="eager"` e `fetchpriority="high"`.

### Formato WebP com fallback

```html
<picture>
  <source srcset="/imagens/servico.webp" type="image/webp" />
  <img src="/imagens/servico.jpg" alt="Nome do serviço" />
</picture>
```

O backend deve servir as imagens em WebP. O `<picture>` garante fallback para JPG em browsers antigos.

### srcset para responsividade

Cards de serviço carregam a imagem no tamanho adequado ao viewport:

```html
<img
  srcset="
    /img/servico-320.webp 320w,
    /img/servico-640.webp 640w,
    /img/servico-1024.webp 1024w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  alt="Nome do serviço"
/>
```

### Dimensões explícitas

Sempre definir `width` e `height` nas imagens para evitar CLS (Cumulative Layout Shift):
```html
<img width="400" height="300" ... />
```

O CSS pode redimensionar com `object-fit: cover`, mas as dimensões evitam o layout shift ao carregar.

---

## Code Splitting com React.lazy

Todas as páginas são importadas com `React.lazy`. O Vite automaticamente cria chunks separados.

```
// lib/router.tsx
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'))
```

**Agrupamento de chunks:** recursos usados em múltiplas páginas vão para o chunk de vendor ou de shared. O Vite cuida disso automaticamente via `manualChunks` no `vite.config.ts`:

```
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-router': ['react-router-dom'],
        'vendor-form': ['react-hook-form', 'zod'],
        'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
      }
    }
  }
}
```

---

## Skeleton Screens

**Regra:** todo conteúdo que carrega de forma assíncrona deve ter um skeleton correspondente. Spinners são reservados para ações de submissão.

| Componente de conteúdo | Skeleton correspondente |
|---|---|
| `ServiceCard` | `SkeletonServiceCard` (1:1 shape) |
| `PedidoCard` | `SkeletonPedidoCard` |
| `CotacaoCard` | `SkeletonCotacaoCard` |
| `OrcamentoCard` | `SkeletonOrcamentoCard` |
| Detalhe de serviço | `SkeletonServicodetalhe` (galeria + texto + CTA) |
| Lista de avaliações | `SkeletonAvaliacoes` (3 items) |
| Perfil do usuário | `SkeletonPerfil` |

O `Suspense` do React renderiza o skeleton enquanto o chunk da página ou os dados estão carregando.

---

## Service Worker

**Fase 1:** sem service worker. Assets servidos com headers de cache longos do CDN.

**Fase 2 (futuro):** Workbox para:
- Cache de assets estáticos (JS, CSS, fontes) com estratégia `CacheFirst`
- Cache de imagens com estratégia `StaleWhileRevalidate`
- Funcionalidade offline básica: exibir últimos pedidos e cotações do cache

---

## Bundle Analysis

Ferramentas de análise integradas ao processo de build:

```
// Gerar relatório visual do bundle
npm run build -- --report
```

Usa `rollup-plugin-visualizer` para gerar um mapa de treemap do bundle. Antes de cada release major, verificar:
- Nenhum chunk de página > 100kb gzipped
- Nenhuma dependência inesperada no vendor chunk
- Ausência de imports de lodash completo (usar lodash-es ou imports específicos)
- Ausência de moment.js (usar date-fns que é tree-shakeable)

---

## Font Loading

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap"
  rel="stylesheet"
/>
```

`font-display: swap` garantido pelo parâmetro da URL do Google Fonts. Fontes do sistema como fallback: `Inter, system-ui, -apple-system, sans-serif`.

---

## Checklist de Performance por Feature

Antes de fazer PR com nova feature, verificar:

- [ ] Imagens com `loading="lazy"` (exceto above-the-fold)
- [ ] Skeleton implementado para todos os estados de carregamento
- [ ] `staleTime` configurado adequadamente no hook
- [ ] Sem imports de bibliotecas grandes sem avaliar alternativa
- [ ] Componente de lista usa virtualização se > 100 itens
- [ ] Animações CSS em vez de JavaScript onde possível
- [ ] `React.memo` em componentes pesados que recebem props estáveis
- [ ] `useMemo` / `useCallback` apenas onde há evidência de lentidão (não preventivo)
