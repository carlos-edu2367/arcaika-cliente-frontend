import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ServiceQuantityDialog } from '@/components/marketplace/ServiceQuantityDialog'

describe('ServiceQuantityDialog', () => {
  it('asks for square meters and confirms the selected quantity', async () => {
    const onConfirm = vi.fn()

    render(
      <ServiceQuantityDialog
        isOpen
        serviceTitle="Pintura residencial"
        unit="m²"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('Quantos m² serão necessários?')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText(/^quantidade$/i))
    await userEvent.type(screen.getByLabelText(/^quantidade$/i), '12')
    await userEvent.click(screen.getByRole('button', { name: /adicionar ao carrinho/i }))

    expect(onConfirm).toHaveBeenCalledWith(12)
  })

  it('asks for units when the unit is not square meters', () => {
    render(
      <ServiceQuantityDialog
        isOpen
        serviceTitle="Limpeza"
        unit="un"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Quantas unidades serão necessárias?')).toBeInTheDocument()
  })
})
