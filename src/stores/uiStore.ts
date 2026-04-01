import { create } from 'zustand'
import { generateId } from '@/lib/utils'
import type { Toast } from '@/types/ui'

interface UIStore {
  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  isArkyOpen: boolean; toggleArky: () => void; closeArky: () => void
  isLoginModalOpen: boolean; openLoginModal: () => void; closeLoginModal: () => void
}

export const useUIStore = create<UIStore>()((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = generateId()
    // PERF-11: duração varia por tipo — erros ficam mais tempo para o usuário ler
    const defaultDuration = toast.type === 'error' ? 7000 : toast.type === 'warning' ? 5000 : 3500
    const duration = toast.duration ?? defaultDuration
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  isArkyOpen: false, toggleArky: () => set((s) => ({ isArkyOpen: !s.isArkyOpen })), closeArky: () => set({ isArkyOpen: false }),
  isLoginModalOpen: false, openLoginModal: () => set({ isLoginModalOpen: true }), closeLoginModal: () => set({ isLoginModalOpen: false }),
}))
