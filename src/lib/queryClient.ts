import { QueryClient } from '@tanstack/react-query'

// PERF-08: staleTime 5 min globalmente para dados estáticos (categorias, perfil, etc.)
// Dados dinâmicos (carrinho, pedidos) usam staleTime: 0 sobrescrito no próprio hook
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60_000, gcTime: 10 * 60_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { onError: (e) => console.error('[mutation]', e) },
  },
})
