import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Carrinho from '@/pages/Carrinho'

const atualizarServico = { mutate: vi.fn(), isPending: false }
const removerServico = { mutate: vi.fn(), isPending: false }
const atualizarProduto = { mutate: vi.fn(), isPending: false }
const removerProduto = { mutate: vi.fn(), isPending: false }
const removerItem = { mutate: vi.fn(), isPending: false }

vi.mock('@/hooks/useCarrinho', () => ({
  useCarrinho: () => ({
    data: {
      cliente_id: 'cliente-1',
      criado_em: '',
      atualizado_em: '',
      itens: [
        {
          id: 'linha-item-1',
          item_id: 'catalogo-item-1',
          titulo: 'Luva',
          quantidade: 1,
          preco_unitario: '10.00',
          subtotal: '10.00',
        },
      ],
      servicos: [
        {
          id: 'linha-servico-1',
          servico_id: 'catalogo-servico-1',
          titulo: 'Pintura',
          quantidade: 2,
          preco_unitario: '50.00',
          subtotal: '100.00',
          unidade_medida: 'm²',
          produtos: [],
        },
      ],
      produtos: [
        {
          id: 'linha-produto-1',
          produto_id: 'catalogo-produto-1',
          titulo: 'Tinta extra',
          quantidade: 3,
          preco_unitario: '20.00',
          subtotal: '60.00',
        },
      ],
      totais: {
        subtotal_itens: '10.00',
        subtotal_servicos: '100.00',
        subtotal_produtos: '60.00',
        subtotal_geral: '170.00',
        desconto: '0.00',
        total: '170.00',
      },
    },
    isLoading: false,
    removerServico,
    atualizarServico,
    removerItem,
    removerProduto,
    atualizarProduto,
    aplicarCupom: { mutate: vi.fn(), isPending: false },
  }),
}))

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({ addToast: vi.fn() }),
}))

vi.mock('@/services/api/carrinho', () => ({
  carrinhoService: { removerCupom: vi.fn() },
}))

function renderCarrinho() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/carrinho']}>
        <Routes>
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/checkout" element={<div>Checkout</div>} />
          <Route path="/marketplace" element={<div>Marketplace</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Carrinho quantity controls', () => {
  it('updates and removes services using the catalog service id', async () => {
    renderCarrinho()

    await userEvent.click(screen.getByRole('button', { name: /aumentar quantidade de pintura/i }))
    expect(atualizarServico.mutate).toHaveBeenCalledWith({
      id: 'catalogo-servico-1',
      quantidade: 3,
    })

    await userEvent.click(screen.getByRole('button', { name: /remover pintura/i }))
    expect(removerServico.mutate).toHaveBeenCalledWith('catalogo-servico-1')
  })

  it('updates and removes products using the catalog product id', async () => {
    renderCarrinho()

    await userEvent.click(screen.getByRole('button', { name: /diminuir quantidade de tinta extra/i }))
    expect(atualizarProduto.mutate).toHaveBeenCalledWith({
      id: 'catalogo-produto-1',
      quantidade: 2,
    })

    await userEvent.click(screen.getByRole('button', { name: /remover tinta extra/i }))
    expect(removerProduto.mutate).toHaveBeenCalledWith('catalogo-produto-1')
  })

  it('removes marketplace items using the catalog item id', async () => {
    renderCarrinho()

    await userEvent.click(screen.getByRole('button', { name: /remover luva/i }))
    expect(removerItem.mutate).toHaveBeenCalledWith('catalogo-item-1')
  })
})
