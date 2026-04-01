import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/domain'
import { queryClient } from '@/lib/queryClient'
import { useCarrinhoStore } from '@/stores/carrinhoStore'

interface AuthStore {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (token: string, refreshToken: string, user: User) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(persist(
  (set) => ({
    user: null, token: null, refreshToken: null, isAuthenticated: false,
    login: (token, refreshToken, user) => { 
      localStorage.setItem('arcaika_token', token)
      localStorage.setItem('arcaika_refresh_token', refreshToken)
      set({ token, refreshToken, user, isAuthenticated: true }) 
    },
    logout: () => {
      // API-07: limpa tokens, estado do auth e todo o cache do React Query ao fazer logout
      localStorage.removeItem('arcaika_token')
      localStorage.removeItem('arcaika_refresh_token')
      set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
      // API-07: reseta contador do carrinho para evitar vazamento de dados entre usuários
      useCarrinhoStore.getState().reset()
      queryClient.clear()
    },
    updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
  }),
  { 
    name: 'arcaika_auth', 
    partialize: (s) => ({ 
      user: s.user, 
      token: s.token, 
      refreshToken: s.refreshToken, 
      isAuthenticated: s.isAuthenticated 
    }) 
  }
))

// API-11: sincronização de logout entre abas
// Quando o storage for atualizado em outra aba, verifica se a sessão foi encerrada
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'arcaika_auth') {
      try {
        const newState = JSON.parse(e.newValue ?? '{}')
        if (newState?.state?.isAuthenticated === false) {
          useAuthStore.getState().logout()
        }
      } catch {
        // ignora JSON inválido
      }
    }
  })
}
