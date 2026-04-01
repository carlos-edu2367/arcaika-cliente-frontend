import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Localidade {
  cidade: string   // "Goiânia"
  estado: string   // "GO"
  label: string    // "Goiânia e Região, GO"
}

interface LocationStore {
  /** Localidade selecionada. null = "Todas as regiões" */
  localidade: Localidade | null
  /** true se o usuário já fez uma escolha (mesmo que tenha escolhido "todas") */
  hasChosen: boolean
  /** Modal de seleção visível */
  isPickerOpen: boolean

  setLocalidade: (loc: Localidade) => void
  clearLocalidade: () => void
  openPicker: () => void
  closePicker: () => void
  setHasChosen: () => void
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      localidade: null,
      hasChosen: false,
      isPickerOpen: false,

      setLocalidade: (loc) =>
        set({ localidade: loc, hasChosen: true, isPickerOpen: false }),

      clearLocalidade: () =>
        set({ localidade: null, hasChosen: true, isPickerOpen: false }),

      openPicker: () => set({ isPickerOpen: true }),
      closePicker: () => set({ isPickerOpen: false }),
      setHasChosen: () => set({ hasChosen: true }),
    }),
    {
      name: 'arcaika_location',
      // Persistir apenas os dados relevantes, não o estado da modal
      partialize: (s) => ({
        localidade: s.localidade,
        hasChosen: s.hasChosen,
      }),
    },
  ),
)
