import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

const storageKeys = ['arcaika_token', 'arcaika_refresh_token']

describe('authStore security', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  })

  it('mantem tokens apenas em memoria ao fazer login', () => {
    const tokenSpy = vi.spyOn(Storage.prototype, 'setItem')

    useAuthStore.getState().login('access-token', 'refresh-token', {
      id: 'cliente-1',
      nome: 'Cliente Teste',
      email: 'cliente@example.com',
    })

    expect(localStorage.getItem('arcaika_token')).toBeNull()
    expect(localStorage.getItem('arcaika_refresh_token')).toBeNull()
    expect(tokenSpy).not.toHaveBeenCalledWith('arcaika_token', expect.any(String))
    expect(tokenSpy).not.toHaveBeenCalledWith('arcaika_refresh_token', expect.any(String))
    expect(useAuthStore.getState().token).toBe('access-token')
    expect(useAuthStore.getState().refreshToken).toBeNull()

    tokenSpy.mockRestore()
  })

  it('remove chaves legadas de token no logout', () => {
    for (const key of storageKeys) {
      localStorage.setItem(key, 'token-legado')
    }

    useAuthStore.getState().logout()

    for (const key of storageKeys) {
      expect(localStorage.getItem(key)).toBeNull()
    }
  })
})
