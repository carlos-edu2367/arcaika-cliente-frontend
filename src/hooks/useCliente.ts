import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '@/services/api/clientes'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import type { User } from '@/types/domain'

const CLIENTE_KEY = ['cliente', 'me']
const ENDERECOS_KEY = ['cliente', 'enderecos']

export function usePerfil() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: CLIENTE_KEY,
    queryFn: clientesService.perfil,
    enabled: isAuthenticated,
  })
}

export function useAtualizarPerfil() {
  const qc = useQueryClient()
  const { updateUser } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  return useMutation({
    mutationFn: (data: Partial<User>) => clientesService.atualizarPerfil(data),
    onSuccess: (data) => {
      qc.setQueryData(CLIENTE_KEY, data)
      updateUser(data)
      addToast({ type: 'success', title: 'Perfil atualizado!' })
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao atualizar perfil.' }),
  })
}

export function useEnderecos() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ENDERECOS_KEY,
    queryFn: clientesService.listarEnderecos,
    enabled: isAuthenticated,
  })
}
