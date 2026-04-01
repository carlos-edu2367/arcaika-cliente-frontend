import { api } from '@/lib/axios'
import type { Cotacao, Orcamento } from '@/types/domain'
import type { PagedResponse } from '@/types/api'

// GAP-005: alinhado com CriarSolicitacaoRequest do backend
export interface CriarCotacaoInput {
  titulo: string             // Correção: Campo obrigatório adicionado
  descricao: string
  tipo_servico: string       
  cidade: string             
  estado: string             
  endereco_completo: string  
  metragem?: number          
  aceita_remoto?: boolean
  data_desejada?: string
  orcamento_minimo?: number
  orcamento_maximo?: number
}

export const cotacoesService = {
  listar: (params?: { page?: number; page_size?: number }) =>
    api.get<PagedResponse<Cotacao>>('/cotacoes/', { params }).then(r => r.data),
  obter: (id: string) => api.get<any>(`/cotacoes/${id}`).then(r => r.data as any),
  criar: (data: CriarCotacaoInput) => api.post<Cotacao>('/cotacoes/', data).then(r => r.data),
  cancelar: (id: string) => api.delete(`/cotacoes/${id}`).then(r => r.data),
  aceitos: () => api.get<Cotacao[]>('/cotacoes/aceitos').then(r => r.data),
  obterOrcamento: (cid: string, oid: string) =>
    api.get<Orcamento>(`/cotacoes/${cid}/orcamentos/${oid}`).then(r => r.data),
  aceitarOrcamento: (cid: string, oid: string, cupom_codigo?: string) =>
    api.put<Orcamento>(`/cotacoes/${cid}/orcamentos/${oid}/aceitar`, { cupom_codigo }).then(r => r.data),
  rejeitarOrcamento: (cid: string, oid: string) =>
    api.put<Orcamento>(`/cotacoes/${cid}/orcamentos/${oid}/rejeitar`).then(r => r.data),
}