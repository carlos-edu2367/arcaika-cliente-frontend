import { api } from '@/lib/axios'
import type { Avaliacao } from '@/types/domain'
import type { AvaliacoesPagedResponse } from '@/types/api'

export interface AvaliacoesOrgResponse {
  avaliacoes: Avaliacao[]
  media_nota: number
  total_avaliacoes: number
  pagina: number
  por_pagina: number
}

// GAP-008: campo correto é alvo_id (não referencia_id)
export interface CriarAvaliacaoInput {
  alvo_id: string                                        // era: referencia_id
  pedido_id: string                                      // novo campo obrigatório para vincular ao pedido
  tipo: 'servico' | 'organizacao' | 'prestador'
  nota: number
  titulo?: string                                        // campo opcional do backend
  comentario?: string
  nome_cliente?: string
}

export const avaliacoesService = {
  doServico: (id: string, pagina = 1, limite = 20) => 
    api.get<AvaliacoesPagedResponse>(`/avaliacoes/servico/${id}`, { params: { pagina, limite } }).then(r => r.data),
  daOrganizacao: (id: string, pagina = 1, limite = 20) => 
    api.get<AvaliacoesOrgResponse>(`/avaliacoes/organizacao/${id}`, { params: { pagina, limite } }).then(r => r.data),
  doPrestador: (id: string) => api.get<Avaliacao[]>(`/avaliacoes/prestador/${id}`).then(r => r.data),
  criar: (data: CriarAvaliacaoInput) => api.post<Avaliacao>('/avaliacoes/', data).then(r => r.data),
  deletar: (id: string) => api.delete(`/avaliacoes/${id}`).then(r => r.data),
}
