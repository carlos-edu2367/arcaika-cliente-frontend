import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { midiaService, AssinarUrlsResponse, FotoAssinada } from '@/services/api/midia'

export const MIDIA_KEYS = {
  all: ['midia'] as const,
  itemFotos: (itemId: string) => ['midia', 'item', itemId, 'fotos'] as const,
  servicoFotos: (servicoId: string) => ['midia', 'servico', servicoId, 'fotos'] as const,
  produtoServicoFotos: (produtoId: string) => ['midia', 'produto-servico', produtoId, 'fotos'] as const,
  batch: (referencias: any[]) => ['midia', 'batch', referencias] as const,
}

export function useItemPhotos(itemId: string) {
  return useQuery({
    queryKey: MIDIA_KEYS.itemFotos(itemId),
    queryFn: async () => {
      const response = await midiaService.assinarUrls([{ tipo: 'item', id: itemId }])
      const fotosDoItem = response.urls_por_referencia[itemId] || []
      return {
        fotos: fotosDoItem,
        total: fotosDoItem.length
      }
    },
    staleTime: 5 * 60_000,
    enabled: !!itemId,
  })
}

export function useServicePhotos(servicoId: string) {
  return useQuery({
    queryKey: MIDIA_KEYS.servicoFotos(servicoId),
    queryFn: async () => {
      const response = await midiaService.assinarUrls([{ tipo: 'servico', id: servicoId }])
      const fotosDoServico = response.urls_por_referencia[servicoId] || []
      return {
        fotos: fotosDoServico,
        total: fotosDoServico.length
      }
    },
    staleTime: 5 * 60_000,
    enabled: !!servicoId,
  })
}

export function useProductServicePhotos(produtoId: string) {
  return useQuery({
    queryKey: MIDIA_KEYS.produtoServicoFotos(produtoId),
    queryFn: async () => {
      const response = await midiaService.assinarUrls([{ tipo: 'produto-servico', id: produtoId }])
      const fotosDoProduto = response.urls_por_referencia[produtoId] || []
      return {
        fotos: fotosDoProduto,
        total: fotosDoProduto.length
      }
    },
    staleTime: 5 * 60_000,
    enabled: !!produtoId,
  })
}

export function useBatchPhotos(referencias: { tipo: 'item' | 'servico', id: string }[]) {
  const chunks = useMemo(() => {
    const res = []
    for (let i = 0; i < referencias.length; i += 5) {
      res.push(referencias.slice(i, i + 5))
    }
    return res
  }, [referencias])

  const queryResults = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: MIDIA_KEYS.batch(chunk),
      queryFn: () => midiaService.assinarUrls(chunk),
      staleTime: 5 * 60_000,
      enabled: chunk.length > 0,
    })),
  })

  const allPhotos = useMemo(() => {
    const map: Record<string, FotoAssinada[]> = {}
    queryResults.forEach((result) => {
      if (result.data?.urls_por_referencia) {
        Object.assign(map, result.data.urls_por_referencia)
      }
    })
    return map
  }, [queryResults])

  const isLoading = queryResults.some((result) => result.isLoading)

  return { data: allPhotos, isLoading }
}

export function useUploadAnexoSolicitacao() {
  const addToast = useUIStore?.((s: any) => s.addToast) || (() => {})
  
  return useMutation({
    mutationFn: ({ solicitacaoId, files }: { solicitacaoId: string, files: File[] }) => 
      Promise.all(files.map(file => midiaService.uploadAnexoSolicitacao(solicitacaoId, file))),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Anexos enviados com sucesso!' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erro ao enviar alguns anexos.' })
    }
  })
}
