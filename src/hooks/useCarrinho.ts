import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { carrinhoService } from '@/services/api/carrinho'
import { useCarrinhoStore } from '@/stores/carrinhoStore'
import { useUIStore } from '@/stores/uiStore'
import type { CarrinhoItem, Carrinho } from '@/types/domain'

export const CARRINHO_KEY = ['carrinho']

/** Mescla os três arrays do carrinho em um único para exibição de compatibilidade */
export function mergeCarrinhoItens(carrinho: Carrinho | undefined): CarrinhoItem[] {
  if (!carrinho) return []
  
  const mappedItens: CarrinhoItem[] = (carrinho.itens || []).map((i) => ({
    id: i.id,
    tipo: 'item' as const,
    referencia_id: i.item_id,
    nome: i.titulo,
    preco: parseFloat(i.preco_unitario),
    quantidade: i.quantidade,
    foto_url: i.foto_url
  }))

  const mappedServicos: CarrinhoItem[] = (carrinho.servicos || []).map((s) => ({
    id: s.id,
    tipo: 'servico' as const,
    referencia_id: s.servico_id,
    nome: s.titulo,
    preco: parseFloat(s.preco_unitario),
    quantidade: s.quantidade,
    foto_url: s.foto_url
  }))

  const mappedProdutos: CarrinhoItem[] = (carrinho.produtos || []).map((p) => ({
    id: p.id,
    tipo: 'produto' as const,
    referencia_id: p.produto_id,
    nome: p.titulo,
    preco: parseFloat(p.preco_unitario),
    quantidade: p.quantidade,
    foto_url: p.foto_url
  }))

  return [...mappedItens, ...mappedServicos, ...mappedProdutos]
}

export function useCarrinho() {
  const qc = useQueryClient()
  const setItemCount = useCarrinhoStore((s) => s.setItemCount)
  const addToast = useUIStore((s) => s.addToast)

  const query = useQuery({
    queryKey: CARRINHO_KEY,
    queryFn: carrinhoService.obter,
    staleTime: 0,
  })

  useEffect(() => {
    if (query.data) {
      const countItens = (query.data.itens || []).reduce((acc, i) => acc + i.quantidade, 0)
      const countServicos = (query.data.servicos || []).reduce((acc, s) => acc + s.quantidade, 0)
      const countProdutos = (query.data.produtos || []).reduce((acc, p) => acc + p.quantidade, 0)
      
      // Contar também produtos aninhados em serviços?
      let countNested = 0
      query.data.servicos?.forEach((s) => {
        s.produtos?.forEach((p) => countNested += p.quantidade)
      })

      setItemCount(countItens + countServicos + countProdutos + countNested)
    }
  }, [query.data, setItemCount])

  const invalidate = () => qc.invalidateQueries({ queryKey: CARRINHO_KEY })

  const adicionarServico = useMutation({
    mutationFn: ({ id, quantidade, produtosIds }: { id: string; quantidade?: number; produtosIds?: string[] }) =>
      carrinhoService.adicionarServico(id, quantidade, produtosIds),
    onMutate: () => useCarrinhoStore.getState().increment(),
    onSuccess: () => { invalidate(); addToast({ type: 'success', title: 'Serviço adicionado!' }) },
    onError: () => { useCarrinhoStore.getState().decrement(); addToast({ type: 'error', title: 'Erro ao adicionar.' }) },
  })

  const removerServico = useMutation({
    mutationFn: (id: string) => carrinhoService.removerServico(id),
    onSuccess: () => { invalidate(); addToast({ type: 'info', title: 'Serviço removido.' }) },
    onError: () => addToast({ type: 'error', title: 'Erro ao remover.' }),
  })

  const adicionarItem = useMutation({
    mutationFn: ({ id, quantidade }: { id: string; quantidade?: number }) =>
      carrinhoService.adicionarItem(id, quantidade),
    onMutate: () => useCarrinhoStore.getState().increment(),
    onSuccess: () => { invalidate(); addToast({ type: 'success', title: 'Item adicionado!' }) },
    onError: () => { useCarrinhoStore.getState().decrement(); addToast({ type: 'error', title: 'Erro ao adicionar.' }) },
  })

  const removerItem = useMutation({
    mutationFn: (id: string) => carrinhoService.removerItem(id),
    onSuccess: () => { invalidate(); addToast({ type: 'info', title: 'Item removido.' }) },
    onError: () => addToast({ type: 'error', title: 'Erro ao remover.' }),
  })

  const adicionarProduto = useMutation({
    mutationFn: ({ id, quantidade }: { id: string; quantidade?: number }) =>
      carrinhoService.adicionarProduto(id, quantidade),
    onMutate: () => useCarrinhoStore.getState().increment(),
    onSuccess: () => { invalidate(); addToast({ type: 'success', title: 'Produto adicionado!' }) },
    onError: () => { useCarrinhoStore.getState().decrement(); addToast({ type: 'error', title: 'Erro ao adicionar.' }) },
  })

  const removerProduto = useMutation({
    mutationFn: (id: string) => carrinhoService.removerProduto(id),
    onSuccess: () => { invalidate(); addToast({ type: 'info', title: 'Produto removido.' }) },
    onError: () => addToast({ type: 'error', title: 'Erro ao remover.' }),
  })

  const atualizarProduto = useMutation({
    mutationFn: ({ id, quantidade }: { id: string; quantidade: number }) =>
      carrinhoService.atualizarProduto(id, quantidade),
    onSuccess: () => invalidate(),
  })

  const atualizarServico = useMutation({
    mutationFn: ({ id, quantidade }: { id: string; quantidade: number }) =>
      carrinhoService.atualizarServico(id, quantidade),
    onSuccess: () => invalidate(),
  })

  const aplicarCupom = useMutation({
    mutationFn: (codigo: string) => carrinhoService.aplicarCupom(codigo),
    onSuccess: () => { invalidate(); addToast({ type: 'success', title: 'Cupom aplicado!' }) },
    onError: () => addToast({ type: 'error', title: 'Cupom inválido.' }),
  })

  return { 
    ...query, 
    adicionarServico, 
    removerServico, 
    atualizarServico,
    adicionarItem, 
    removerItem, 
    adicionarProduto, 
    removerProduto, 
    atualizarProduto,
    aplicarCupom 
  }
}
