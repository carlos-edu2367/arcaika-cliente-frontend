import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAuthStore } from '@/stores/authStore'

// Permite controlar o estado de autenticação nos testes
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

function renderWithRouter(ui: React.ReactNode, { initialEntries = ['/protegido'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/auth/login" element={<div>Página de login</div>} />
        <Route
          path="/protegido"
          element={<RequireAuth>{ui}</RequireAuth>}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAuth', () => {
  it('renderiza o conteúdo quando o usuário está autenticado', () => {
    vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: true } as never)
    renderWithRouter(<div>Área protegida</div>)
    expect(screen.getByText('Área protegida')).toBeInTheDocument()
  })

  it('redireciona para /auth/login quando não autenticado', () => {
    vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false } as never)
    renderWithRouter(<div>Área protegida</div>)
    expect(screen.getByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Área protegida')).not.toBeInTheDocument()
  })
})
