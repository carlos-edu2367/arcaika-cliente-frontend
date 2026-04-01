import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { avaliacoesService, type CriarAvaliacaoInput } from '@/services/api/avaliacoes'
import { useUIStore } from '@/stores/uiStore'

export function useAvaliacoesServico(servicoId: string) {
  return useQuery({
    queryKey: ['avaliacoes', 'servico', servicoId],
    queryFn: () => avaliacoesService.doServico(servicoId),
    enabled: !!servicoId,
    staleTime: 5 * 60_000,
  })
}

export function useCriarAvaliacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CriarAvaliacaoInput) => avaliacoesService.criar(data),
    onSuccess: (_, variables) => {
      // GAP-016: Invalida a query correta baseada no tipo (servico ou organizacao)
      qc.invalidateQueries({ queryKey: ['avaliacoes', variables.tipo, variables.alvo_id] })
      qc.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}

export function useAvaliacoesOrganizacao(organizacaoId: string, pagina: number = 1, limite: number = 20) {
  return useQuery({
    queryKey: ['avaliacoes', 'organizacao', organizacaoId, pagina, limite],
    queryFn: () => avaliacoesService.daOrganizacao(organizacaoId, pagina, limite),
    enabled: !!organizacaoId,
    staleTime: 5 * 60_000,
  })
}
