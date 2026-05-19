import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Orcamentos from '@/pages/Conta/Orcamentos'

vi.mock('@/components/account/AccountSidebar', () => ({
  AccountSidebar: () => <aside>Menu da conta</aside>,
}))

vi.mock('@/hooks/useCotacoes', () => ({
  useCotacoes: () => ({ data: [], isLoading: false, error: null }),
  useCotacao: () => ({ data: null, isLoading: false }),
}))

describe('CTAs de orçamento', () => {
  it('leva o botão Nova solicitação para a rota dedicada do wizard', async () => {
    render(
      <MemoryRouter initialEntries={['/conta/orcamentos']}>
        <Routes>
          <Route path="/conta/orcamentos" element={<Orcamentos />} />
          <Route path="/orcamentos/novo" element={<div>Wizard dedicado</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('link', { name: /nova solicitação/i }))

    expect(screen.getByText('Wizard dedicado')).toBeInTheDocument()
  })

  it('leva o CTA de estado vazio para a rota dedicada do wizard', async () => {
    render(
      <MemoryRouter initialEntries={['/conta/orcamentos']}>
        <Routes>
          <Route path="/conta/orcamentos" element={<Orcamentos />} />
          <Route path="/orcamentos/novo" element={<div>Wizard dedicado</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('link', { name: /fazer meu primeiro pedido/i }))

    expect(screen.getByText('Wizard dedicado')).toBeInTheDocument()
  })
})
