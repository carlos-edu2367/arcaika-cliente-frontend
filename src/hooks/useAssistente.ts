import { useMutation } from '@tanstack/react-query'
import { assistenteService } from '@/services/api/assistente'
import { useUIStore } from '@/stores/uiStore'

export function useEnviarMensagemArky() {
  const addToast = useUIStore((s) => s.addToast)
  return useMutation({
    mutationFn: (mensagem: string) => assistenteService.chat(mensagem),
    retry: 1,
    onError: () => addToast({ type: 'error', title: 'Falha ao conectar com o Arky. Tente novamente.' }),
  })
}

export function useRecomendacoesArky() {
  return useMutation({
    mutationFn: (contexto: string) => assistenteService.recomendacoes(contexto),
    retry: 1,
  })
}
