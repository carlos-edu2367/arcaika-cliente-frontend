import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cotacoesService, type CriarCotacaoInput } from '@/services/api/cotacoes'
import { useUIStore } from '@/stores/uiStore'
import type { Cotacao, Orcamento, SolicitacaoDetalheResponse, CotacaoStatus } from '@/types/domain'

export const COTACOES_KEY = ['cotacoes']

export function useCotacoes(page = 1, pageSize = 20) {
  const query = useQuery({
    queryKey: [...COTACOES_KEY, 'list', page, pageSize],
    queryFn: () => cotacoesService.listar({ page, page_size: pageSize }),
    staleTime: 0,
  })
  
  // O backend retorna 'solicitacoes' em vez do padrão 'items' nesta rota
  const rawItems = query.data?.items ?? (query.data as any)?.solicitacoes ?? []
  
  // Traduz o payload do backend para a interface 'Cotacao' esperada pela UI
  const parsedItems: Cotacao[] = rawItems.map((item: any) => {
    let status = item.status
    if (!status) {
      const temAprovado = item.orcamentos?.some((o: any) => o.status === 'aprovado' || o.status?.toUpperCase() === 'ACEITO')
      if (temAprovado) {
        status = 'ACEITA'
      } else if (item.ativa === false) {
        // Se a solicitação não tem as propostas populadas (modo listagem), mas tem propostas e foi inativada, assumimos resolvido/aceito
        if (!item.orcamentos && item.qtd_orcamentos > 0) {
          status = 'ACEITA'
        } else {
          status = 'CANCELADA'
        }
      }
      else if (item.qtd_orcamentos > 0) status = 'COM_PROPOSTAS'
      else status = 'ABERTA'
    }

    return {
      ...item,
      status,
      criado_em: item.criada_em || item.criado_em,
      // Garante que o frontend saiba a qtd de propostas sem precisar de carregar os detalhes
      orcamentos: item.orcamentos || new Array(item.qtd_orcamentos || 0).fill({}),
    } as Cotacao
  })

  return {
    ...query,
    data: parsedItems,
    hasNext: query.data?.has_next ?? false,
    total: query.data?.total ?? 0,
  }
}

export function useCotacao(id: string | null) {
  return useQuery({
    queryKey: [...COTACOES_KEY, id],
    queryFn: async () => {
      const data = await cotacoesService.obter(id!) as SolicitacaoDetalheResponse
      
      // Mapeia a resposta aninhada para o formato plano de 'Cotacao' esperado pela UI
      if (!data?.solicitacao) return null
      
      const { solicitacao, orcamentos } = data
      
      const temAprovado = orcamentos.some((o: any) => o.status === 'aprovado' || o.status?.toUpperCase() === 'ACEITO')
      let statusCotacao: CotacaoStatus = 'ABERTA'
      if (temAprovado) {
        statusCotacao = 'ACEITA'
      } else if (!solicitacao.ativa) {
        statusCotacao = 'CANCELADA'
      } else if (orcamentos.length > 0) {
        statusCotacao = 'COM_PROPOSTAS'
      }

      const parsedCotacao: Cotacao = {
        id: solicitacao.id,
        descricao: solicitacao.descricao,
        categoria: { id: '', valor: solicitacao.tipo_servico, slug: solicitacao.tipo_servico },
        localidade: `${solicitacao.cidade}, ${solicitacao.estado}`,
        status: statusCotacao,
        criado_em: solicitacao.criada_em,
        orcamentos: orcamentos.map(orc => ({
          id: orc.id,
          cotacao_id: solicitacao.id,
          valor: typeof orc.valor === 'string' ? parseFloat(orc.valor) : orc.valor,
          descricao: orc.descricao || '',
          prazo_dias: orc.prazo_dias || undefined,
          status: (orc.status === 'aguardando_aprovacao' ? 'PENDENTE' : orc.status === 'aprovado' ? 'ACEITO' : orc.status.toUpperCase()) as any,
          criado_em: orc.criado_em,
          organizacao: {
            id: orc.organizacao_id,
            nome: orc.provedor_nome,
            avaliacao_media: 0, // Backend não retorna nestes detalhes
            total_avaliacoes: 0
          }
        }))
      }
      
      return parsedCotacao
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