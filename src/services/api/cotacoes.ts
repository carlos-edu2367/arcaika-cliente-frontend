import { api } from '@/lib/axios'
import type {
  Cotacao,
  ListaSolicitacoesClienteResponse,
  OrcamentoDetalheResponse,
  SolicitacaoComOrcamentosResponse,
  SolicitacaoResponse,
} from '@/types/domain'

export interface CriarCotacaoInput {
  titulo: string
  descricao: string
  tipo_servico: string
  cidade: string
  estado: string
  endereco_completo: string
  metragem?: number
}

export const cotacoesService = {
  listar: (params?: { page?: number; limit?: number }) =>
    api.get<ListaSolicitacoesClienteResponse>('/cotacoes/', { params }).then(r => r.data),
  obter: (id: string) =>
    api.get<SolicitacaoComOrcamentosResponse>(`/cotacoes/${id}`).then(r => r.data),
  criar: (data: CriarCotacaoInput) => api.post<SolicitacaoResponse>('/cotacoes/', data).then(r => r.data),
  cancelar: (id: string) => api.delete(`/cotacoes/${id}`).then(r => r.data),
  aceitos: () => api.get<Cotacao[]>('/cotacoes/aceitos').then(r => r.data),
  obterOrcamento: (cid: string, oid: string) =>
    api.get<OrcamentoDetalheResponse>(`/cotacoes/${cid}/orcamentos/${oid}`).then(r => r.data),
  aceitarOrcamento: (cid: string, oid: string, cupom_codigo?: string) =>
    api.put<void>(`/cotacoes/${cid}/orcamentos/${oid}/aceitar`, { cupom_codigo }).then(r => r.data),
  rejeitarOrcamento: (cid: string, oid: string) =>
    api.put<OrcamentoDetalheResponse>(`/cotacoes/${cid}/orcamentos/${oid}/rejeitar`).then(r => r.data),
}
