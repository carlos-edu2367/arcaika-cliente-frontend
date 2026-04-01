import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCarrinho } from '@/hooks/useCarrinho'

// Mock dos serviços
vi.mock('@/services/api/carrinho', () => ({
  carrinhoService: {
    obter: vi.fn().mockResolvedValue({
      itens: [
        { id: '1', tipo: 'servico', referencia_id: 's1', nome: 'Limpeza Residencial', preco: 150, quantidade: 1 },
      ],
      subtotal: 150,
      desconto: 0,
      total: 150,
    }),
    adicionarServico: vi.fn().mockResolvedValue({}),
    removerServico: vi.fn().mockResolvedValue({}),
    aplicarCupom: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/stores/carrinhoStore', () => ({
  useCarrinhoStore: () => ({ setItemCount: vi.fn() }),
}))

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({ addToast: vi.fn() }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCarrinho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carrega os itens do carrinho da API', async () => {
    const { result } = renderHook(() => useCarrinho(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.itens).toHaveLength(1)
    expect(result.current.data?.itens[0].nome).toBe('Limpeza Residencial')
    expect(result.current.data?.total).toBe(150)
  })
})
