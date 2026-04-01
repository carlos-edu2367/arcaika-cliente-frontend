# 06 — Estado e API

Este documento define como dados fluem do backend para a interface: configuração do Axios, convenções de React Query keys, estrutura dos hooks customizados e dos stores Zustand.

---

## Separação de responsabilidades de estado

| Tipo de estado | Onde vive | Exemplos |
|---|---|---|
| **Server state** (dados do backend) | TanStack Query | Lista de serviços, pedidos, carrinho, perfil |
| **Global UI state** (sessão e interface) | Zustand | Usuário autenticado, tema, fila de toasts |
| **Local component state** | useState / useReducer | Formulário aberto/fechado, tab ativa, valor de input |
| **Wizard state** (fluxo multi-step) | useReducer + Context | Dados acumulados entre passos do checkout |
| **URL state** (filtros e buscas) | React Router (searchParams) | Filtros do marketplace, query de busca |

---

## Configuração do Axios

Arquivo: `src/lib/axios.ts`

### Instância base

```
// src/lib/axios.ts (estrutura conceitual)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,  // 10 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})
```

### Interceptor de request — injeção de token

```
api.interceptors.request.use((config) => {
  const token = authStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Interceptor de response — tratamento de 401

```
let isRefreshing = false
let failedQueue: Array<...> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Encapsula a request em uma fila para tentar novamente após refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = sessionStorage.getItem('arcaika:refresh_token')
        const { data } = await axios.post('/auth/refresh', { refresh_token: refreshToken })
        authStore.getState().setToken(data.access_token)
        processQueue(null, data.access_token)
        return api(originalRequest)  // Retenta a request original
      } catch (refreshError) {
        processQueue(refreshError, null)
        authStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
```

### Tratamento padronizado de erros de API

```
// utils/apiError.ts
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 422 && data?.detail) {
      // Retorna o primeiro erro de validação
      return Array.isArray(data.detail)
        ? data.detail[0].msg
        : data.detail
    }
    if (status === 404) return 'Recurso não encontrado.'
    if (status === 403) return 'Você não tem permissão para esta ação.'
    if (status === 500) return 'Erro interno do servidor. Tente novamente.'
    if (status === 0 || !status) return 'Sem conexão com a internet.'
  }
  return 'Ocorreu um erro inesperado.'
}
```

---

## React Query Keys — Convenção

**Formato:** arrays aninhados do mais geral para o mais específico.

```
// Exemplos de query keys

// Coleções
['marketplace', 'servicos']
['marketplace', 'itens']
['marketplace', 'categorias']
['marketplace', 'recomendacoes']
['pedidos']
['cotacoes']
['clientes', 'me']
['clientes', 'me', 'enderecos']
['avaliacoes', 'servico', servico_id]
['avaliacoes', 'organizacao', org_id]

// Items individuais
['marketplace', 'servicos', servico_id]
['marketplace', 'itens', item_id]
['pedidos', pedido_id]
['cotacoes', cotacao_id]
['cotacoes', cotacao_id, 'orcamentos']
['cotacoes', cotacao_id, 'orcamentos', orcamento_id]

// Com filtros (objetos de parâmetros como último elemento)
['marketplace', 'servicos', { localidade: 'SP', categoria: 'limpeza', pagina: 1 }]
['cotacoes', { status: 'aguardando' }]
```

**Regra de invalidação:** invalidar pelo prefixo mais curto para afetar toda a coleção:
```
// Invalida todos os queries de pedidos
queryClient.invalidateQueries({ queryKey: ['pedidos'] })

// Invalida apenas o pedido específico
queryClient.invalidateQueries({ queryKey: ['pedidos', pedido_id] })
```

---

## Hooks Customizados

### `useMarketplace`

Arquivo: `src/features/marketplace/hooks/useMarketplace.ts`

```
// Assinatura conceitual

function useMarketplace(filtros: FiltrosMarketplace) {
  return useInfiniteQuery({
    queryKey: ['marketplace', 'servicos', filtros],
    queryFn: ({ pageParam = 1 }) =>
      api.get('/marketplace/', { params: { ...filtros, pagina: pageParam } }),
    getNextPageParam: (lastPage) =>
      lastPage.data.has_next ? lastPage.data.pagina + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  })
}

function useServico(id: string) {
  return useQuery({
    queryKey: ['marketplace', 'servicos', id],
    queryFn: () => api.get(`/marketplace/servicos/${id}`),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

function useCategorias() {
  return useQuery({
    queryKey: ['marketplace', 'categorias'],
    queryFn: () => api.get('/marketplace/categorias'),
    staleTime: 30 * 60 * 1000,
  })
}
```

---

### `useCarrinho`

Arquivo: `src/features/carrinho/hooks/useCarrinho.ts`

```
function useCarrinho() {
  const queryClient = useQueryClient()

  const carrinho = useQuery({
    queryKey: ['carrinho'],
    queryFn: () => api.get('/carrinho/'),
    staleTime: 30 * 1000,
  })

  const adicionarItem = useMutation({
    mutationFn: (payload: AdicionarItemPayload) =>
      api.post('/carrinho/itens', payload),
    onMutate: async (payload) => {
      // Optimistic update: incrementa o count no store
      carrinhoStore.getState().incrementCount()
      return { previousCount: carrinhoStore.getState().count - 1 }
    },
    onError: (_, __, context) => {
      carrinhoStore.getState().setCount(context.previousCount)
      toast.error('Erro ao adicionar ao carrinho.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['carrinho'] })
    },
  })

  const removerItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/carrinho/itens/${itemId}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['carrinho'] }),
  })

  const aplicarCupom = useMutation({
    mutationFn: (codigo: string) => api.post('/carrinho/cupom', { codigo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carrinho'] }),
    onError: () => toast.error('Cupom inválido ou expirado.'),
  })

  return { carrinho, adicionarItem, removerItem, aplicarCupom }
}
```

---

### `usePedidos`

Arquivo: `src/features/pedidos/hooks/usePedidos.ts`

```
function usePedidos(filtro?: StatusPedido) {
  return useQuery({
    queryKey: ['pedidos', { status: filtro }],
    queryFn: () => api.get('/pedidos/', { params: { status: filtro } }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

function usePedido(id: string) {
  return useQuery({
    queryKey: ['pedidos', id],
    queryFn: () => api.get(`/pedidos/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

function useCancelarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/pedidos/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      toast.success('Pedido cancelado com sucesso.')
    },
  })
}
```

---

### `useCotacoes`

Arquivo: `src/features/cotacoes/hooks/useCotacoes.ts`

```
function useCotacoes() {
  return useQuery({
    queryKey: ['cotacoes'],
    queryFn: () => api.get('/cotacoes/'),
    staleTime: 2 * 60 * 1000,
  })
}

function useCotacao(id: string) {
  return useQuery({
    queryKey: ['cotacoes', id],
    queryFn: () => api.get(`/cotacoes/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

function useAceitarOrcamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cotacaoId, orcamentoId }: AceitarPayload) =>
      api.put(`/cotacoes/${cotacaoId}/orcamentos/${orcamentoId}/aceitar`),
    onSuccess: (_, { cotacaoId }) => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes', cotacaoId] })
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] })
      toast.success('Orçamento aceito! O prestador será notificado.')
    },
  })
}
```

---

### `useCliente`

Arquivo: `src/features/conta/hooks/useCliente.ts`

```
function useCliente() {
  return useQuery({
    queryKey: ['clientes', 'me'],
    queryFn: () => api.get('/clientes/me'),
    staleTime: 5 * 60 * 1000,
    enabled: authStore.getState().isAuthenticated,
  })
}

function useAtualizarPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AtualizarPerfilPayload) => api.put('/clientes/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', 'me'] })
      toast.success('Perfil atualizado com sucesso.')
    },
  })
}
```

---

### `useArky`

Arquivo: `src/features/arky/hooks/useArky.ts`

```
function useArky() {
  const [mensagens, setMensagens] = useState<MensagemArky[]>(
    // Restaura do sessionStorage
    JSON.parse(sessionStorage.getItem('arcaika:arky:historico') ?? '[]')
  )
  const [isTyping, setIsTyping] = useState(false)

  const enviarMensagem = useMutation({
    mutationFn: (mensagem: string) =>
      api.post('/assistente/chat', { mensagem }),
    onMutate: (mensagem) => {
      const novaMensagem: MensagemArky = { role: 'user', content: mensagem, id: uuid() }
      setMensagens(prev => [...prev, novaMensagem])
      setIsTyping(true)
    },
    onSuccess: (response) => {
      const respostaArky: MensagemArky = {
        role: 'assistant',
        content: response.data.resposta,
        id: uuid(),
      }
      setMensagens(prev => {
        const atualizado = [...prev, respostaArky]
        sessionStorage.setItem('arcaika:arky:historico', JSON.stringify(atualizado))
        return atualizado
      })
    },
    onError: () => toast.error('Arky está indisponível no momento.'),
    onSettled: () => setIsTyping(false),
  })

  return { mensagens, isTyping, enviarMensagem }
}
```

---

## Zustand Stores

### `authStore`

Arquivo: `src/stores/authStore.ts`

```
// Estado e actions

interface AuthState {
  user: ClienteInfo | null
  token: string | null
  isAuthenticated: boolean

  setAuth: (user: ClienteInfo, token: string) => void
  setToken: (token: string) => void
  logout: () => void
}
```

**Persistência:** `token` é salvo em `localStorage` via middleware `persist` do Zustand. `user` é salvo junto (informações não sensíveis: nome, email, id).

**`setAuth`:** chamado após login ou cadastro bem-sucedido. Seta `user`, `token`, `isAuthenticated = true`.

**`logout`:** limpa o estado, remove `localStorage`, redireciona para `/auth/login`, limpa o sessionStorage do refresh token e o histórico da Arky.

---

### `carrinhoStore`

Arquivo: `src/stores/carrinhoStore.ts`

```
interface CarrinhoState {
  count: number  // número total de itens (usado no badge da TopBar)
  setCount: (n: number) => void
  incrementCount: () => void
  decrementCount: () => void
  resetCount: () => void
}
```

O `count` é populado ao carregar `GET /carrinho/` e mantido atualizado via optimistic updates. Não armazena o carrinho completo — esses dados ficam no cache do TanStack Query.

---

### `uiStore`

Arquivo: `src/stores/uiStore.ts`

```
interface UIState {
  // Tema
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Arky drawer
  isArkyOpen: boolean
  openArky: () => void
  closeArky: () => void

  // Modal de login (para ações que exigem auth)
  isLoginModalOpen: boolean
  loginModalMessage: string
  openLoginModal: (message?: string) => void
  closeLoginModal: () => void
}
```

---

## Error Boundaries

Cada seção crítica da aplicação tem seu próprio `ErrorBoundary`:

| Seção | Componente de fallback |
|---|---|
| Página inteira | `ErrorPage` (fullscreen, botão "Recarregar") |
| Lista do marketplace | `MarketplaceError` (mensagem + botão retry) |
| Carrinho | `CarrinhoError` (mensagem + link para marketplace) |
| Checkout | `CheckoutError` (bloqueia o passo, instrui contatar suporte) |
| Arky | `ArkyError` ("Arky indisponível" com retry silencioso) |

Implementação com `react-error-boundary`:
```
<ErrorBoundary FallbackComponent={MarketplaceError} onReset={() => queryClient.clear()}>
  <MarketplacePage />
</ErrorBoundary>
```

---

## Tratamento de erros de API — Mapa completo

| Status HTTP | Comportamento no frontend |
|---|---|
| `400 Bad Request` | Toast de erro genérico com mensagem da API |
| `401 Unauthorized` | Interceptor tenta refresh; se falhar, logout + redirect `/auth/login` |
| `403 Forbidden` | Toast "Você não tem permissão para esta ação" |
| `404 Not Found` | Redireciona para `NotFoundPage` ou exibe `EmptyState` no componente |
| `422 Unprocessable Entity` | Erros de validação exibidos nos campos do formulário via `setError` do React Hook Form |
| `429 Too Many Requests` | Toast "Muitas tentativas. Aguarde alguns segundos." com retry automático após `Retry-After` |
| `500 Internal Server Error` | Toast de erro + log para serviço de monitoramento |
| `503 Service Unavailable` | Toast "Serviço temporariamente indisponível. Tente novamente em instantes." |
| Timeout / sem conexão | Toast "Sem conexão com a internet. Verifique sua rede." |
