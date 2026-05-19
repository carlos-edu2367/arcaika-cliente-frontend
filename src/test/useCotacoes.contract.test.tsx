import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCotacoes } from '@/hooks/useCotacoes'
import { cotacoesService } from '@/services/api/cotacoes'

vi.mock('@/services/api/cotacoes', () => ({
  cotacoesService: {
    listar: vi.fn(),
  },
}))

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({ addToast: vi.fn() }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCotacoes contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mapeia a resposta real com solicitacoes, pagina, por_pagina e total', async () => {
    vi.mocked(cotacoesService.listar).mockResolvedValue({
      solicitacoes: [
        {
          id: 'sol-1',
          cliente_id: 'cli-1',
          titulo: 'Pintura do apartamento',
          descricao: 'Pintar sala e quartos',
          tipo_servico: 'Pintura',
          cidade: 'São Paulo',
          estado: 'SP',
          endereco_completo: 'Rua A, 123',
          metragem: 55,
          ativa: true,
          qtd_orcamentos: 2,
          criada_em: '2026-05-18T12:00:00Z',
          status: 'orcamento_recebido',
          numero_contrato: 'CT-001',
          data_finalizacao_estimada: '2026-06-01',
        },
      ],
      pagina: 1,
      por_pagina: 1,
      total: 2,
    })

    const { result } = renderHook(() => useCotacoes(1, 1), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(cotacoesService.listar).toHaveBeenCalledWith({ page: 1, limit: 1 })
    expect(result.current.total).toBe(2)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      id: 'sol-1',
      titulo: 'Pintura do apartamento',
      status: 'orcamento_recebido',
      localidade: 'São Paulo, SP',
      categoria: { valor: 'Pintura', slug: 'Pintura' },
      numero_contrato: 'CT-001',
    })
    expect(result.current.data?.[0].orcamentos).toHaveLength(2)
  })
})
