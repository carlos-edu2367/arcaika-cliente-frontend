import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CarrinhoStore {
  itemCount: number
  setItemCount: (n: number) => void
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCarrinhoStore = create<CarrinhoStore>()(persist(
  (set) => ({
    itemCount: 0,
    setItemCount: (n) => set({ itemCount: Math.max(0, n) }),
    increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
    decrement: () => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
    reset: () => set({ itemCount: 0 }),
  }),
  { name: 'arcaika_carrinho_count' }
))
