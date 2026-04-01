import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { marketplaceService } from '@/services/api/marketplace'
import type { MarketplaceParams } from '@/types/api'
import { MarketplacePagedResponse } from '@/types/api'
import { MarketplaceItem, MarketplaceServico, MarketplaceCategoria, RecomendacoesResponse } from '@/types/marketplace'

export const MARKETPLACE_KEYS = {
  all: ['marketplace'] as const,
  itens: (params?: MarketplaceParams) => ['marketplace', 'itens', params] as const,
  servicos: (params?: MarketplaceParams) => ['marketplace', 'servicos', params] as const,
  categorias: () => ['marketplace', 'categorias'] as const,
  maisVendidos: (limit?: number) => ['marketplace', 'mais-vendidos', limit] as const,
  recomendacoes: () => ['marketplace', 'recomendacoes'] as const,
  servico: (id: string) => ['marketplace', 'servico', id] as const,
  item: (id: string) => ['marketplace', 'item', id] as const,
  organizacao: (id: string) => ['marketplace', 'organizacao', id] as const,
  servicosPorOrg: (id: string) => ['marketplace', 'organizacao', id, 'servicos'] as const,
}

export function useMarketplaceItens(params?: MarketplaceParams, options?: any) {
  return useQuery<MarketplacePagedResponse<MarketplaceItem>>({
    queryKey: MARKETPLACE_KEYS.itens(params),
    queryFn: () => marketplaceService.listarItens(params),
    ...options
  })
}

export function useMarketplaceServicos(params?: MarketplaceParams, options?: any) {
  return useQuery<MarketplacePagedResponse<MarketplaceServico>>({
    queryKey: MARKETPLACE_KEYS.servicos(params),
    queryFn: () => marketplaceService.listarServicos(params),
    ...options
  })
}

export function useCategorias(options?: any) {
  return useQuery<MarketplaceCategoria[]>({
    queryKey: MARKETPLACE_KEYS.categorias(),
    queryFn: marketplaceService.categorias,
    staleTime: 10 * 60_000,
    ...options
  })
}

export function useMaisVendidos(limit: number = 10, options?: any) {
  return useQuery<MarketplaceServico[]>({
    queryKey: MARKETPLACE_KEYS.maisVendidos(limit),
    queryFn: () => marketplaceService.maisVendidos(limit),
    ...options
  })
}

export function useRecomendacoes(options?: any) {
  return useQuery<RecomendacoesResponse>({
    queryKey: MARKETPLACE_KEYS.recomendacoes(),
    queryFn: marketplaceService.recomendacoes,
    ...options
  })
}

export function useServico(id: string) {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.servico(id),
    queryFn: () => marketplaceService.detalheServico(id),
    enabled: !!id,
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.item(id),
    queryFn: () => marketplaceService.detalheItem(id),
    enabled: !!id,
  })
}

export function useProdutosRelacionados(servicoId: string) {
  return useQuery({
    queryKey: ['marketplace', 'servico', servicoId, 'produtos'],
    queryFn: () => marketplaceService.listarProdutosRelacionados(servicoId),
    enabled: !!servicoId,
  })
}

export function useOrganizacao(id: string) {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.organizacao(id),
    queryFn: () => marketplaceService.obterOrganizacao(id),
    enabled: !!id,
  })
}

export function useInfiniteServicosPorOrg(id: string, limite: number = 12) {
  return useInfiniteQuery({
    queryKey: MARKETPLACE_KEYS.servicosPorOrg(id),
    queryFn: ({ pageParam = 1 }) => marketplaceService.obterServicosPorOrg(id, pageParam, limite),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagina * lastPage.por_pagina < lastPage.total) {
        return lastPage.pagina + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!id,
  })
}