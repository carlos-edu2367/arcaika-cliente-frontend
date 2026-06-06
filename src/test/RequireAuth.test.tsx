import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('axios', () => ({
  default: { post: vi.fn() },
}))

import axios from 'axios'

function renderWithRouter(ui: React.ReactNode, { initialEntries = ['/protegido'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/auth/login" element={<div>Pagina de login</div>} />
        <Route
          path="/protegido"
          element={<RequireAuth>{ui}</RequireAuth>}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset()
    vi.mocked(axios.post).mockReturnValue(new Promise(() => {}) as never)
  })

  it('renderiza o conteudo quando o usuario esta autenticado com token', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'valid-token',
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    } as never)
    renderWithRouter(<div>Area protegida</div>)
    expect(screen.getByText('Area protegida')).toBeInTheDocument()
  })

  it('tenta refresh silencioso antes de redirecionar quando nao ha token em memoria', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    } as never)
    renderWithRouter(<div>Area protegida</div>)

    expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      {},
      { withCredentials: true }
    )
    expect(screen.queryByText('Pagina de login')).not.toBeInTheDocument()
    expect(screen.queryByText('Area protegida')).not.toBeInTheDocument()
  })

  it('redireciona para /auth/login quando o refresh silencioso falha', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('refresh failed'))
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    } as never)
    renderWithRouter(<div>Area protegida</div>)

    await waitFor(() => {
      expect(screen.getByText('Pagina de login')).toBeInTheDocument()
    })
    expect(screen.queryByText('Area protegida')).not.toBeInTheDocument()
  })

  it('reconstrui usuario basico quando o refresh retorna payload achatado', async () => {
    const login = vi.fn()
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        access_token: 'new-access',
        usuario_id: 'cliente-1',
        nome_completo: 'Cliente Teste',
        tipo_usuario: 'cliente',
      },
    })
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
      login,
      logout: vi.fn(),
      user: null,
    } as never)

    renderWithRouter(<div>Area protegida</div>)

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('new-access', null, {
        id: 'cliente-1',
        nome: 'Cliente Teste',
        email: '',
      })
    })
  })

  it('exibe spinner enquanto faz refresh silencioso (isAuthenticated sem token)', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
    } as never)
    renderWithRouter(<div>Area protegida</div>)
    expect(screen.queryByText('Area protegida')).not.toBeInTheDocument()
    expect(screen.queryByText('Pagina de login')).not.toBeInTheDocument()
  })
})
