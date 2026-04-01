import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosService, type CriarPedidoInput, type IniciarPagamentoInput, type StatusPagamentoResponse } from '@/services/api/pedidos'
import { useUIStore } from '@/stores/uiStore'

export const PEDIDOS_KEY = ['pedidos']

export function usePedidos(page = 1, pageSize = 20) {
  const query = useQuery({
    queryKey: [...PEDIDOS_KEY, 'list', page, pageSize],
    queryFn: () => pedidosService.listar({ page, page_size: pageSize }),
    staleTime: 0,
  })
  return {
    ...query,
    data: (query.data as any)?.pedidos || (query.data as any)?.itens || (query.data as any)?.items || (Array.isArray(query.data) ? query.data : []),
    hasNext: ((query.data as any)?.pagina || (query.data as any)?.page || 1) * ((query.data as any)?.por_pagina || (query.data as any)?.page_size || 20) < ((query.data as any)?.total || 0),
    total: (query.data as any)?.total ?? 0,
  }
}

export function usePedido(id: string) {
  return useQuery({
    queryKey: [...PEDIDOS_KEY, id],
    queryFn: () => pedidosService.obter(id),
    enabled: !!id,
    staleTime: 0,
  })
}

export function useCriarPedido() {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  return useMutation({
    mutationFn: (data: CriarPedidoInput) => pedidosService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PEDIDOS_KEY })
      addToast({ type: 'success', title: 'Pedido criado!' })
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao criar pedido.' }),
  })
}

export function usePagarPedido(pedidoId: string) {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  return useMutation({
    mutationFn: (data: IniciarPagamentoInput) => pedidosService.pagar(pedidoId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...PEDIDOS_KEY, pedidoId] })
      qc.invalidateQueries({ queryKey: PEDIDOS_KEY })
      qc.invalidateQueries({ queryKey: ['carrinho'] })
      addToast({ type: 'success', title: 'Pagamento iniciado!' })
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao processar pagamento.' }),
  })
}
export function useStatusPagamento(pedidoId: string, enabled: boolean) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: [...PEDIDOS_KEY, pedidoId, 'status-pagamento'],
    queryFn: () => pedidosService.consultarStatusPagamento(pedidoId),
    enabled: !!pedidoId && enabled,
    refetchInterval: (query) => {
      const status = (query.state.data?.status_pedido || '').toUpperCase()
      // Continua polling se estiver aguardando
      if (['PENDENTE', 'AGUARDANDO PAGAMENTO'].includes(status)) {
        return 5000 // 5 segundos
      }
      return false
    },
    // Invalida a lista de pedidos quando o status mudar (indicando que o polling deve parar)
    // Usando select / ou useEffect no componente para disparar a invalidação
  })
}
