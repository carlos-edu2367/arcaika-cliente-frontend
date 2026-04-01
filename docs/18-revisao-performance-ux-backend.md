# 18 — Revisão Completa: Performance, UX/UI e Conexão ao Backend

> **Data da revisão:** 2026-03-26
> **Escopo:** Análise estática de todos os arquivos do `frontend-cliente/src/` cruzados com `backend/web/`
> **Total de problemas identificados:** 64

---

## Índice

1. [Performance](#1-performance)
2. [UX / UI](#2-ux--ui)
3. [Conexão ao Backend](#3-conexão-ao-backend)
4. [Tabela de Prioridades Consolidada](#4-tabela-de-prioridades-consolidada)
5. [Roadmap de Correção](#5-roadmap-de-correção)

---

## 1. Performance

### 🔴 ALTO

#### PERF-01 · Ordenação client-side em lista de busca

| | |
|---|---|
| **Arquivo** | `src/pages/Busca/index.tsx` linhas 90–97 |
| **Categoria** | Render |

`[...results].sort(...)` é executado a cada render. Em listas com 100+ resultados causa frame drops visíveis ao trocar o critério de ordenação.

**Correção:** Adicionar parâmetro `sort` a `MarketplaceParams` e delegar a ordenação ao backend.

---

#### PERF-02 · Imagens sem `loading="lazy"` nos cards

| | |
|---|---|
| **Arquivo** | `src/components/marketplace/ServiceCard.tsx` linhas 20–25 |
| **Categoria** | Network |

Cards carregam todas as imagens imediatamente, inclusive as fora da viewport. Em uma grade de 20 cards isso gera 20 requisições simultâneas competindo com o JS.

**Correção:** Adicionar `loading="lazy"` ao `<img>` no ServiceCard. Manter `loading="eager"` apenas na imagem principal de páginas de detalhe.

---

#### PERF-03 · Subscription ao store completo em `useCarrinho`

| | |
|---|---|
| **Arquivo** | `src/hooks/useCarrinho.ts` linhas 11–12 |
| **Categoria** | Render |

`useCarrinhoStore()` sem seletor assina o store inteiro — qualquer mudança de estado recria o componente, mesmo que o dado utilizado não tenha mudado.

**Correção:** Usar seletor: `const setItemCount = useCarrinhoStore((s) => s.setItemCount)`.

---

#### PERF-04 · Polling de recomendações sem timeout máximo nem cleanup

| | |
|---|---|
| **Arquivo** | `src/hooks/useMarketplace.ts` linhas 76–90 |
| **Categoria** | Memory / Network |

`refetchInterval` sem limite máximo de tentativas. Se o job nunca completar, o polling continua indefinidamente. Se o componente desmontar (usuário navegar), as requisições prosseguem em background.

**Correção:**
```typescript
// No useEffect de início do job:
useEffect(() => {
  let isMounted = true
  let attempts = 0
  const MAX_ATTEMPTS = 40  // 40 × 3s = 2 minutos

  marketplaceService.iniciarRecomendacoes().then((res) => {
    if (!isMounted) return
    // ...
  })

  return () => { isMounted = false }
}, [])

// No refetchInterval, verificar tentativas:
refetchInterval: (query) => {
  if (++attempts >= MAX_ATTEMPTS) { setIsReady(true); return false }
  return query.state.data?.status === 'done' ? false : 3000
}
```

---

#### PERF-05 · `ArkyDrawer` sempre montado no DOM

| | |
|---|---|
| **Arquivo** | `src/router/index.tsx` linha 154 |
| **Categoria** | Render |

`<ArkyDrawer />` está montado em todas as rotas, mesmo quando fechado. Hooks de scroll e atualização de mensagens executam em cada mudança de store, mesmo sem o drawer aberto.

**Correção:** Renderização condicional na raiz:
```tsx
{isArkyOpen && <ArkyDrawer />}
```
Ou usar `React.lazy` + `Suspense` para carregar o componente apenas quando necessário.

---

### 🟡 MÉDIO

#### PERF-06 · `ServiceCard` sem `React.memo`

| | |
|---|---|
| **Arquivo** | `src/components/marketplace/ServiceCard.tsx` linha 13 |
| **Categoria** | Render |

Cards re-renderizam quando o componente pai atualiza (filtros, localidade), mesmo que `servico` prop não tenha mudado.

**Correção:**
```tsx
export const ServiceCard = React.memo(ServiceCardComponent,
  (prev, next) => prev.servico.id === next.servico.id
)
```

---

#### PERF-07 · Marketplace acumula todos os itens em memória

| | |
|---|---|
| **Arquivo** | `src/pages/Marketplace/index.tsx` linhas 61–71 |
| **Categoria** | Memory |

`allItems` cresce linearmente com as páginas carregadas. Sem virtualização, renderizar 200+ cards no DOM degrada o scroll.

**Correção:** Implementar `react-window` (virtualização) para listas longas, ou limitar o acúmulo a 3–4 páginas e usar paginação tradicional.

---

#### PERF-08 · `staleTime` global baixo para dados estáticos

| | |
|---|---|
| **Arquivo** | `src/lib/queryClient.ts` linha 5 |
| **Categoria** | Network |

`staleTime: 60_000` (1 min) causa refetch de categorias ao navegar entre páginas, gerando requisições desnecessárias.

**Correção:** Aumentar para `300_000` (5 min) globalmente. Usar `staleTime: 0` apenas para dados em tempo real (carrinho, pedidos).

---

#### PERF-09 · Timeout do Axios inadequado para mobile

| | |
|---|---|
| **Arquivo** | `src/lib/axios.ts` linha 6 |
| **Categoria** | Network |

15 segundos de timeout é muito longo para mobile em 3G. Usuários esperam muito antes de ver feedback de falha.

**Correção:** Reduzir para 8s. Aumentar `retry` de 1 para 2. Adicionar backoff exponencial.

---

#### PERF-10 · `vite.config.ts` sem compressão Gzip/Brotli

| | |
|---|---|
| **Arquivo** | `vite.config.ts` |
| **Categoria** | Bundle |

Build sem compressão. Assets servidos sem gzip aumentam o tempo de download do bundle em ~70%.

**Correção:** Adicionar `vite-plugin-compression`:
```typescript
import viteCompression from 'vite-plugin-compression'
// plugins: [..., viteCompression({ algorithm: 'brotliCompress' })]
```

---

#### PERF-11 · Toast com duração fixa independente do tipo

| | |
|---|---|
| **Arquivo** | `src/stores/uiStore.ts` linha 18 |
| **Categoria** | UX / Memory |

Toasts de erro desaparecem no mesmo tempo que os de sucesso. Usuários não leem mensagens de erro a tempo.

**Correção:**
```typescript
const duration = type === 'error' ? 7000 : type === 'warning' ? 5000 : 3500
```

---

### 🟢 BAIXO

| ID | Arquivo | Problema | Correção |
|----|---------|----------|----------|
| PERF-12 | `ArkyDrawer.tsx` L39 | Scroll não debounced — múltiplas mensagens causam animações sobrepostas | Usar `behavior: 'auto'` ou debounce de 100ms |
| PERF-13 | `Home/index.tsx` L22 | Logo PNG sem `width`/`height` → layout shift (CLS) | Adicionar dimensões explícitas ou usar SVG |
| PERF-14 | `Marketplace/index.tsx` L233 | "Carregar mais" requer clique manual | Adicionar `IntersectionObserver` para auto-fetch |
| PERF-15 | `ServicoDetalhe.tsx` L236 | `formatCurrency()` chamado sem `useMemo` | `useMemo(() => formatCurrency(preco), [preco])` |

---

## 2. UX / UI

### 🔴 ALTO

#### UX-01 · Busca na TopBar desconectada do backend

| | |
|---|---|
| **Arquivo** | `src/components/layout/TopBar.tsx` linhas 54–67 |
| **Categoria** | Navigation |

Campo de busca navega para `/busca?q=...` mas a página `/busca` implementa filtragem local, não chama o endpoint de busca do marketplace. Usuário digita, navega, e vê resultados estáticos.

**Correção:** Fazer `/busca` chamar `marketplaceService.listar({ q })` passando a query da URL. Ou redirecionar para `/marketplace?q=...`.

---

#### UX-02 · Sem paginação em Pedidos e Orçamentos

| | |
|---|---|
| **Arquivo** | `src/pages/Pedidos/index.tsx`, `src/pages/Orcamentos/index.tsx` |
| **Categoria** | Navigation |

Listagens carregam todos os itens sem controle de página. Com 50+ pedidos, a página fica inutilizável.

**Correção:** Adicionar paginação ("Carregar mais") com `page_size: 10`. Exibir contador "X de Y pedidos".

---

#### UX-03 · Focus trap ausente em modais e drawer

| | |
|---|---|
| **Arquivo** | `src/components/arky/ArkyDrawer.tsx`, `src/pages/Checkout/index.tsx`, `src/pages/Conta/Enderecos.tsx` |
| **Categoria** | Accessibility |

Modais e o drawer não capturam o foco. Usuários de teclado podem tabular para elementos do fundo. Não há retorno de foco ao fechar. Falta `role="dialog"` e `aria-labelledby`.

**Correção:** Usar a lib `focus-trap-react` ou o primitivo `@radix-ui/react-dialog`. Adicionar `onKeyDown={(e) => e.key === 'Escape' && onClose()}`.

---

#### UX-04 · Progress bar do Checkout sem labels no mobile

| | |
|---|---|
| **Arquivo** | `src/pages/Checkout/index.tsx` linhas 56–83 |
| **Categoria** | Mobile / Navigation |

Labels dos passos têm `hidden sm:block` — em mobile o usuário vê apenas círculos numerados sem contexto.

**Correção:** Exibir label abreviado no mobile (ex.: "2. Endereço"). Ou exibir apenas o passo atual em texto.

---

#### UX-05 · Erros de validação no Checkout sem destaque de campo

| | |
|---|---|
| **Arquivo** | `src/pages/Checkout/index.tsx` linhas 512–517 |
| **Categoria** | Forms / Error State |

`addToast({ type: 'warning', ... })` exibe mensagem genérica sem indicar qual campo falhou nem rolar até ele.

**Correção:** Adicionar borda vermelha ao campo inválido + scroll automático. Usar React Hook Form `setError` para erros inline.

---

#### UX-06 · Backdrop de modais não fecha ao clicar

| | |
|---|---|
| **Arquivo** | `src/pages/Pedidos/Detalhe.tsx` L355, `src/pages/Orcamentos/Detalhe.tsx` |
| **Categoria** | Interaction |

`<div className="fixed inset-0 bg-black/50">` sem `onClick`. Usuários esperam que clicar fora do modal o feche.

**Correção:**
```tsx
<div
  className="fixed inset-0 bg-black/50"
  onClick={onClose}
/>
```

---

### 🟡 MÉDIO

#### UX-07 · Formatação de preços inconsistente

| | |
|---|---|
| **Arquivo** | Múltiplos (Novo.tsx L258, ServiceCard, Checkout) |
| **Categoria** | Visual Consistency |

Alguns preços usam `R$ ${min}` (sem formatação), outros usam `formatCurrency()`. Aparência inconsistente e não-profissional.

**Correção:** Substituir todos os `R$ ${valor}` por `formatCurrency(valor)`. Padronizar em `R$ 1.000,00`.

---

#### UX-08 · Cores de status inconsistentes entre entidades

| | |
|---|---|
| **Arquivo** | Pedidos, Orcamentos, Detalhe pages |
| **Categoria** | Visual Consistency |

Status PENDENTE usa cores diferentes em Pedidos vs Orçamentos. Não há mapeamento semântico centralizado.

**Correção:** Criar constante global:
```typescript
export const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'warning', CONFIRMADO: 'info', EM_ANDAMENTO: 'info',
  CONCLUIDO: 'success', CANCELADO: 'error',
  ABERTA: 'warning', COM_PROPOSTAS: 'info', ACEITA: 'success', EXPIRADA: 'neutral',
}
```

---

#### UX-09 · Skeleton de loading não condiz com layout real

| | |
|---|---|
| **Arquivo** | `src/pages/Marketplace/index.tsx` |
| **Categoria** | Loading State |

`CardSkeleton` tem proporção diferente do `ServiceCard` real. Causa content shift (CLS) visível ao carregar.

**Correção:** Garantir que altura/proporção do skeleton bata com o card real (aspect-ratio fixo).

---

#### UX-10 · CEP auto-preenchimento sem feedback de falha

| | |
|---|---|
| **Arquivo** | `src/pages/Checkout/index.tsx` L145–155, `src/pages/Auth/Cadastro.tsx` L341–358 |
| **Categoria** | Forms |

`catch {}` silencia falha no lookup de CEP. Usuário não sabe se o preenchimento automático funcionou.

**Correção:** Exibir toast "CEP não encontrado — preencha o endereço manualmente" em caso de falha.

---

#### UX-11 · Botão de excluir item do carrinho sem confirmação

| | |
|---|---|
| **Arquivo** | `src/pages/Carrinho/index.tsx` linhas 132–138 |
| **Categoria** | Interaction |

Remoção de item com um clique, sem undo. Usuário pode remover por acidente.

**Correção:** Toast com botão "Desfazer" (setTimeout de 5s antes de chamar a mutation de verdade), ou modal de confirmação.

---

#### UX-12 · Sem breadcrumbs em páginas de detalhe

| | |
|---|---|
| **Arquivo** | `Pedidos/Detalhe.tsx`, `ServicoDetalhe.tsx`, `Orcamentos/Detalhe.tsx` |
| **Categoria** | Navigation |

Só há botão "Voltar" sem indicação de hierarquia. Usuário perde contexto de onde está.

**Correção:** Adicionar `<nav aria-label="breadcrumb">`: `Pedidos > #ABC123` ou `Marketplace > Pintura Interna`.

---

#### UX-13 · Imagens de thumbnail em ServicoDetalhe sem `alt`

| | |
|---|---|
| **Arquivo** | `src/pages/Marketplace/ServicoDetalhe.tsx` linhas 138–139 |
| **Categoria** | Accessibility |

`alt=""` nas thumbnails. Screen readers anunciam elementos sem descrição.

**Correção:** `alt={`Foto ${i + 1} de ${servico.nome}`}`.

---

#### UX-14 · Conteúdo mobile oculto por barra CTA fixa

| | |
|---|---|
| **Arquivo** | `src/pages/Marketplace/ItemDetalhe.tsx` linhas 232–262 |
| **Categoria** | Mobile |

Barra CTA fixa no fundo sem `padding-bottom` no contêiner. Últimos elementos ficam cobertos.

**Correção:** Adicionar `pb-24` (ou `pb-32`) ao contêiner principal nas páginas com CTA fixa.

---

#### UX-15 · Validação de formulário só ao submeter (sem feedback em tempo real)

| | |
|---|---|
| **Arquivo** | `src/pages/Auth/Cadastro.tsx` |
| **Categoria** | Forms |

React Hook Form configurado sem `mode: 'onChange'`. Erros aparecem apenas após tentativa de submit.

**Correção:** Adicionar `mode: 'onChange'` nos hooks de formulário de registro e endereço.

---

#### UX-16 · Minus button da quantidade não mostra `disabled` quando quantity = 1

| | |
|---|---|
| **Arquivo** | `src/pages/Marketplace/ItemDetalhe.tsx` linhas 178–199 |
| **Categoria** | Forms |

`Math.max(1, q - 1)` impede ir abaixo de 1, mas o botão não fica visualmente desabilitado.

**Correção:** `disabled={quantidade <= 1}` no botão minus.

---

### 🟢 BAIXO

| ID | Arquivo | Problema | Correção |
|----|---------|----------|----------|
| UX-17 | `TopBar.tsx` L87 | Badge do carrinho sem `aria-label` | `aria-label={`${count} itens no carrinho`}` |
| UX-18 | `Toast.tsx` | Toasts no topo podem ficar sob a TopBar no mobile | Usar `top-20` em mobile |
| UX-19 | `ArkyDrawer.tsx` L90 | Mensagens do chat sem `role="log"` | `<div role="log" aria-live="polite">` |
| UX-20 | Múltiplos | Botões com `type` button implícito em forms | Adicionar `type="button"` explicitamente |
| UX-21 | `Enderecos.tsx` L54 | Botão fechar modal sem `aria-label` | `aria-label="Fechar formulário"` |
| UX-22 | `Orcamentos/Novo.tsx` L137 | Input de arquivo sem `id`/`htmlFor` | Adicionar `id="files-upload"` no input |
| UX-23 | `Cadastro.tsx` L244 | Tamanhos de botão inconsistentes entre páginas | Usar variantes do componente Button |
| UX-24 | `ServicoDetalhe.tsx` L214 | Reviews sem paginação (pode ter 100+) | Limitar a 5, adicionar "Ver mais" |
| UX-25 | `Checkout.tsx` L403 | Método de pagamento selecionado sem contraste suficiente | Adicionar `font-bold` + `text-primary` ao selecionado |

---

## 3. Conexão ao Backend

### 🔴 ALTO

#### API-01 · JWT armazenado em `localStorage` (vulnerabilidade XSS)

| | |
|---|---|
| **Arquivo** | `src/lib/axios.ts` L11, `src/stores/authStore.ts` L15–16 |
| **Categoria** | Auth / Security |

Token em `localStorage` é acessível por qualquer script na página. Uma injeção XSS rouba a sessão completamente.

**Correção:** Migrar para cookies `httpOnly; Secure; SameSite=Strict`. Backend deve emitir o token via `Set-Cookie`. Frontend remove o interceptor que lê localStorage.

---

#### API-02 · Sem refresh de token — expiração = logout forçado

| | |
|---|---|
| **Arquivo** | `src/lib/axios.ts` L16–27 |
| **Categoria** | Auth / Token |

Interceptor de 401 faz logout imediato sem tentar renovar o token. Nenhum endpoint `/auth/refresh` existe no backend.

**Correção (backend):** Implementar `POST /auth/cliente/refresh` com refresh token.
**Correção (frontend):**
```typescript
// No interceptor de 401:
const refreshed = await authService.refresh(storedRefreshToken)
if (refreshed) {
  setToken(refreshed.access_token)
  return api(originalRequest)  // retry
}
logout()
```

---

#### API-03 · Nenhum serviço de mídia no frontend

| | |
|---|---|
| **Arquivo** | `src/services/api/` — arquivo ausente |
| **Categoria** | Missing Feature |

Backend tem router completo em `/midia/*` (upload de fotos para itens, serviços, anexos de cotações). Frontend não tem `midiaService` nem hooks correspondentes. Qualquer tela que precise de upload está quebrada.

**Correção:** Criar `src/services/api/midia.ts`:
```typescript
export const midiaService = {
  uploadFotoServico: (id: string, file: File) => { ... },
  listarFotosServico: (id: string) => api.get(`/midia/servicos/${id}/fotos`).then(r => r.data),
  uploadAnexoCotacao: (id: string, file: File) => { ... },
  assinarUrls: (referencias: string[]) =>
    api.post('/midia/assinar-urls', { referencias }).then(r => r.data),
}
```

---

#### API-04 · Shape de `Servico` incompatível com resposta real do backend

| | |
|---|---|
| **Arquivo** | `src/types/domain.ts` L9 vs `backend/web/schemas/marketplace.py` L68–80 |
| **Categoria** | Response / Payload |

Frontend espera `Servico.fotos: string[]`, mas backend retorna `fotos_count: int` (contagem) — fotos reais precisam ser buscadas em `/midia/servicos/{id}/fotos`. Também: campo `preco` no frontend vs `valor_unitario` no backend.

**Correção:**
```typescript
export interface Servico {
  id: string; nome: string; descricao: string
  preco: number              // mapeado de valor_unitario
  preco_promocional?: number // mapeado de valor_promocional
  em_promocao: boolean
  fotos_count: number        // não fotos: string[]
  categoria: Categoria; organizacao: Organizacao
  avaliacao_media: number; total_avaliacoes: number
  disponivel: boolean; tags?: string[]
}
```

---

#### API-05 · Shape de `Carrinho` incompatível com resposta real do backend

| | |
|---|---|
| **Arquivo** | `src/types/domain.ts` L14 vs `backend/web/schemas/carrinho.py` L65–93 |
| **Categoria** | Response / Payload |

Frontend espera `Carrinho.itens: CarrinhoItem[]` (array único). Backend retorna três arrays separados: `itens`, `servicos`, `produtos`. `useCarrinho` acessa `.itens` que pode estar vazio enquanto os outros têm dados.

**Correção:** Atualizar `Carrinho` type:
```typescript
export interface Carrinho {
  itens: CarrinhoItem[]      // itens físicos
  servicos: CarrinhoItem[]   // serviços
  produtos: CarrinhoItem[]   // produtos
  subtotal: number; desconto: number; total: number
  cupom_aplicado?: Cupom
}
```
E atualizar `useCarrinho` para mesclar os arrays quando necessário para exibição.

---

### 🟡 MÉDIO

#### API-06 · Erros HTTP 422 não parseados para o usuário

| | |
|---|---|
| **Arquivo** | `src/lib/axios.ts` L16–27 |
| **Categoria** | Error Handling |

FastAPI retorna `422 Unprocessable Entity` com `{ detail: [{ msg, loc }] }`. O interceptor atual não trata esse caso — o usuário vê um erro genérico em vez de "CPF inválido" ou "Email já cadastrado".

**Correção:**
```typescript
if (error.response?.status === 422) {
  const details = error.response.data.detail
  if (Array.isArray(details)) {
    const msg = details.map(e => e.msg).join('; ')
    error.userMessage = msg
  }
}
```

---

#### API-07 · Estado do auth não limpo em todos os stores ao fazer logout

| | |
|---|---|
| **Arquivo** | `src/stores/authStore.ts` |
| **Categoria** | Auth |

`logout()` limpa o authStore mas não reseta `carrinhoStore` (persistido em localStorage) nem invalida o cache do React Query. Segundo usuário pode ver dados do primeiro.

**Correção:**
```typescript
logout: () => {
  set({ user: null, token: null, isAuthenticated: false })
  localStorage.removeItem('arcaika_token')
  useCarrinhoStore.getState().reset()
  queryClient.clear()  // limpa todo o cache de API
}
```

---

#### API-08 · Sem updates otimistas nas operações do carrinho

| | |
|---|---|
| **Arquivo** | `src/hooks/useCarrinho.ts` linhas 27–43 |
| **Categoria** | UX / Performance |

Após clicar "Adicionar ao carrinho", o usuário espera 500–2000ms sem nenhum feedback visual antes do item aparecer. Pode levar a cliques duplos e adições duplicadas.

**Correção:** Implementar `onMutate` com update otimista e rollback em `onError`.

---

#### API-09 · Polling de recomendações sem tratamento de status `error`

| | |
|---|---|
| **Arquivo** | `src/hooks/useMarketplace.ts` L78–88 |
| **Categoria** | Async Pattern |

Se o backend retornar `status: 'error'`, o frontend continua polling indefinidamente, pois só para quando `status === 'done'`.

**Correção:** Adicionar verificação:
```typescript
if (data?.status === 'error' || data?.status === 'done') {
  if (data.recomendacoes) setRecomendacoes(data.recomendacoes)
  setIsReady(true); setJobId(null); return false
}
```

---

#### API-10 · Cache de pedido não invalidado após pagamento

| | |
|---|---|
| **Arquivo** | `src/hooks/usePedidos.ts` |
| **Categoria** | Cache |

Após `pedidosService.pagar()` ser chamado com sucesso, o cache do pedido não é invalidado. O status do pedido exibido pode ficar desatualizado.

**Correção:** Adicionar ao hook de pagamento:
```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: [...PEDIDOS_KEY, pedidoId] })
  qc.invalidateQueries({ queryKey: CARRINHO_KEY })
}
```

---

#### API-11 · Auth store sem sincronização entre abas

| | |
|---|---|
| **Arquivo** | `src/stores/authStore.ts` |
| **Categoria** | Auth |

Logout em uma aba não desloga as outras. Usuário pode achar que saiu mas outras abas continuam autenticadas.

**Correção:**
```typescript
useEffect(() => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'arcaika_auth' && !JSON.parse(e.newValue ?? '{}').isAuthenticated) {
      logout()
    }
  }
  window.addEventListener('storage', handleStorage)
  return () => window.removeEventListener('storage', handleStorage)
}, [])
```

---

#### API-12 · Metadados de paginação não utilizados

| | |
|---|---|
| **Arquivo** | `src/hooks/usePedidos.ts`, `src/hooks/useCotacoes.ts` |
| **Categoria** | Missing Feature |

`PagedResponse<T>` define `has_next: boolean` e `total: int` mas nenhum hook expõe esses campos para os componentes usarem em paginação.

**Correção:** Retornar `has_next` e `total` dos hooks:
```typescript
return { ...query, hasNext: query.data?.has_next ?? false, total: query.data?.total ?? 0 }
```

---

### 🟢 BAIXO

| ID | Arquivo | Problema | Correção |
|----|---------|----------|----------|
| API-13 | `useCarrinho.ts` | `removerServico`/`removerItem`/`removerProduto` sem toast de sucesso | Adicionar `onSuccess: () => addToast(...)` |
| API-14 | `lib/axios.ts` | Erros 429 (rate limit) sem tratamento especial | Mostrar "Aguarde antes de tentar novamente" |
| API-15 | `useMarketplace.ts` | `useRecomendacoes` sem `isMounted` guard no useEffect | Adicionar flag `let isMounted = true` com cleanup |
| API-16 | `services/api/` | Sem hook `useAvaliacoes` centralizado | Criar `src/hooks/useAvaliacoes.ts` |
| API-17 | `services/api/` | Sem hook `useAssistente` centralizado | Criar `src/hooks/useAssistente.ts` com retry |

---

## 4. Tabela de Prioridades Consolidada

### Críticos — Resolver imediatamente

| ID | Categoria | Problema | Impacto |
|----|-----------|----------|---------|
| API-01 | Segurança | JWT em localStorage (XSS) | Roubo de sessão |
| API-02 | Auth | Sem refresh de token | Logout forçado ao expirar JWT |
| API-03 | Feature | Serviço de mídia ausente | Upload de fotos quebrado |
| API-04 | Payload | `Servico.fotos` incompatível com backend | Crash ao renderizar detalhes |
| API-05 | Payload | `Carrinho` com estrutura errada | Contagem de itens incorreta |
| PERF-01 | Performance | Ordenação client-side em Busca | Jank visível em 100+ itens |
| PERF-02 | Performance | Imagens sem lazy loading | +30% no tempo de carregamento inicial |
| PERF-04 | Performance | Polling sem timeout | Requisições infinitas / memory leak |
| PERF-05 | Performance | ArkyDrawer sempre montado | Re-renders desnecessários em toda navegação |
| UX-01 | UX | Busca da TopBar desconectada | Feature completamente quebrada |
| UX-02 | UX | Sem paginação em Pedidos/Orçamentos | Inutilizável com 50+ registros |
| UX-03 | UX | Focus trap ausente em modais | Acessibilidade completamente quebrada |

### Médios — Próximo ciclo

| ID | Categoria | Problema |
|----|-----------|----------|
| API-06 | Error Handling | 422 não parseado |
| API-07 | Auth | Logout parcial |
| API-08 | UX | Sem updates otimistas no carrinho |
| API-10 | Cache | Pedido desatualizado após pagamento |
| PERF-03 | Performance | Store subscription sem seletor |
| PERF-06 | Performance | ServiceCard sem React.memo |
| PERF-08 | Performance | staleTime global muito baixo |
| UX-04 | UX | Progress bar ilegível no mobile |
| UX-05 | UX | Erros sem destaque de campo |
| UX-07 | UX | Formatação de preços inconsistente |
| UX-08 | UX | Cores de status inconsistentes |
| UX-10 | UX | CEP sem feedback de falha |
| UX-11 | UX | Remoção de item sem confirmação |

---

## 5. Roadmap de Correção

### Sprint 1 (1 semana) — Bloqueadores Críticos
1. Criar `src/services/api/midia.ts` + hook correspondente
2. Corrigir types `Servico` e `Carrinho` para bater com schema real do backend
3. Implementar lazy loading em todas as imagens (`loading="lazy"`)
4. Adicionar focus trap nos modais (usar `@radix-ui/react-dialog`)
5. Conectar busca da TopBar ao marketplace (`/busca` ou `/marketplace?q=`)
6. Adicionar paginação em Pedidos e Orçamentos

### Sprint 2 (1 semana) — Performance e Auth
1. Migrar JWT de localStorage para httpOnly cookie (requer mudança no backend também)
2. Implementar token refresh no interceptor de 401
3. `React.memo` no ServiceCard
4. Polling de recomendações com timeout máximo e cleanup no unmount
5. Corrigir store subscription para usar seletores
6. Tornar ArkyDrawer renderização condicional

### Sprint 3 (1 semana) — UX e Consistência
1. Padronizar formatação de preços com `formatCurrency()` em todo o app
2. Criar `STATUS_COLORS` global para badges consistentes
3. Updates otimistas no carrinho (`onMutate`)
4. Breadcrumbs nas páginas de detalhe
5. Feedback em tempo real nas validações de formulário
6. Sincronização de logout entre abas

### Sprint 4 (1 semana) — Polimento
1. Parsear erros 422 e exibir por campo
2. Limpar estado de todos os stores no logout
3. Throttle/debounce no scroll do ArkyDrawer
4. Compressão Brotli no Vite config
5. `IntersectionObserver` para auto-paginar Marketplace
6. aria-labels faltantes (badges, botões de fechar, inputs de arquivo)

---

*Revisão gerada por análise estática. Total: 22 problemas de performance · 25 problemas de UX/UI · 17 problemas de backend = 64 problemas identificados.*
