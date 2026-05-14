import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

// Evita chamadas reais ao axios no teste de refresh silencioso
vi.mock('axios', () => ({
  default: { post: vi.fn() },
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
  it('renderiza o conteúdo quando o usuário está autenticado com token', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'valid-token',
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    } as never)
    renderWithRouter(<div>Área protegida</div>)
    expect(screen.getByText('Área protegida')).toBeInTheDocument()
  })

  it('redireciona para /auth/login quando não autenticado', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    } as never)
    renderWithRouter(<div>Área protegida</div>)
    expect(screen.getByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Área protegida')).not.toBeInTheDocument()
  })

  it('exibe spinner enquanto faz refresh silencioso (isAuthenticated sem token)', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    } as never)
    renderWithRouter(<div>Área protegida</div>)
    // Spinner renderizado, conteúdo ainda não visível
    expect(screen.queryByText('Área protegida')).not.toBeInTheDocument()
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument()
  })
})
