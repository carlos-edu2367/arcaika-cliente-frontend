import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cotacoesService, type CriarCotacaoInput } from '@/services/api/cotacoes'
import {
  mapSolicitacao,
  mapSolicitacaoComOrcamentos,
  normalizeOrcamentoStatus,
  parseValor,
} from '@/services/api/mappers/cotacoes'
import { useUIStore } from '@/stores/uiStore'
import type { Cotacao } from '@/types/domain'

export const COTACOES_KEY = ['cotacoes']

export function useCotacoes(page = 1, pageSize = 20) {
  const query = useQuery({
    queryKey: [...COTACOES_KEY, 'list', page, pageSize],
    queryFn: () => cotacoesService.listar({ page, limit: pageSize }),
    staleTime: 0,
  })
  
  const parsedItems: Cotacao[] = (query.data?.solicitacoes ?? []).map(mapSolicitacao)

  return {
    ...query,
    data: parsedItems,
    hasNext: query.data ? query.data.pagina * query.data.por_pagina < query.data.total : false,
    total: query.data?.total ?? 0,
  }
}

export function useCotacao(id: string | null) {
  return useQuery({
    queryKey: [...COTACOES_KEY, id],
    queryFn: async () => {
      const data = await cotacoesService.obter(id!)
      
      // Mapeia a resposta aninhada para o formato plano de 'Cotacao' esperado pela UI
      if (!data?.solicitacao) return null
      
      return mapSolicitacaoComOrcamentos(data.solicitacao, data.orcamentos)
    },
    enabled: !!id,
  })
}

export function useOrcamentoDetalhes(cotacaoId: string, orcamentoId: string, isOpen: boolean) {
  return useQuery({
    queryKey: [...COTACOES_KEY, 'orcamento', cotacaoId, orcamentoId],
    queryFn: async () => {
      // Fetch details and attachments in parallel
      const [detalhes, anexosData] = await Promise.all([
        cotacoesService.obterOrcamento(cotacaoId, orcamentoId),
        import('@/services/api/midia').then(m => m.midiaService.listarAnexosOrcamento(orcamentoId))
          .catch(() => ({ anexos: [], total: 0 })) // Fallback if no attachments or error
      ])
      
      return {
        ...detalhes,
        valor: parseValor(detalhes.valor),
        status: normalizeOrcamentoStatus(detalhes.status),
        organizacao: {
          id: detalhes.organizacao_id || detalhes.prestador_id || '',
          nome: detalhes.provedor_nome || 'Prestador Desconhecido',
          avaliacao_media: 0,
          total_avaliacoes: 0,
        },
        anexos: anexosData.anexos || []
      }
    },
    enabled: !!cotacaoId && !!orcamentoId && isOpen,
  })
}

export function useCriarCotacao() {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  return useMutation({
    mutationFn: (data: CriarCotacaoInput) => cotacoesService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COTACOES_KEY })
      addToast({ type: 'success', title: 'Cotação enviada!' })
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao criar cotação.' }),
  })
}
