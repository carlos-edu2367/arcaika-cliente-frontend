import { api } from '@/lib/axios'
import type { Pedido } from '@/types/domain'
import type { PedidosPagedResponse } from '@/types/api'

// GAP-004: alinhado com FinalizarPedidoRequest do backend
export interface AgendamentoInput {
  data: string // YYYY-MM-DD
  periodo: 'manha' | 'tarde'
}

export interface CriarPedidoInput {
  endereco_id: string
  agendamentos: AgendamentoInput[] // obrigatório: 1 a 3 opções
  tipo_pagamento: string
  cupom_codigo?: string
  observacoes?: string
  url_retorno_sucesso?: string
  url_retorno_falha?: string
}

export interface IniciarPagamentoInput {
  tipo: string
  url_retorno_sucesso?: string
  url_retorno_falha?: string
}

export interface IniciarPagamentoResponse {
  pedido_id: string
  url_pagamento: string
  status: string
  mensagem?: string
}

export interface StatusPagamentoResponse {
  pedido_id: string
  pagamento_id: string
  status_pagamento: string
  status_pedido: string
}

export const pedidosService = {
  listar: (params?: { page?: number; page_size?: number }) =>
    api.get<PedidosPagedResponse>('/pedidos/', { 
      params: {
        page: params?.page,
        page_size: params?.page_size,
        pagina: params?.page,
        por_pagina: params?.page_size,
      } 
    }).then(r => r.data),
  obter: (id: string) => api.get<Pedido>(`/pedidos/${id}`).then(r => r.data),
  criar: (data: CriarPedidoInput) => api.post<Pedido>('/pedidos/', data).then(r => r.data),
  cancelar: (id: string) => api.delete(`/pedidos/${id}`).then(r => r.data),
  pagar: (id: string, dados: IniciarPagamentoInput) =>
    api.post<IniciarPagamentoResponse>(`/pedidos/${id}/pagamento`, dados).then(r => r.data),
  consultarStatusPagamento: (id: string) =>
    api.get<StatusPagamentoResponse>(`/pedidos/${id}/pagamento-status`).then(r => r.data),
}
