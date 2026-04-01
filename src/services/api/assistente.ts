import { api } from '@/lib/axios'
import type { MensagemArky, Servico } from '@/types/domain'

// GAP-009: shape real da resposta de recomendações do backend
export interface RecomendacoesArkyResponse {
  recomendacoes: Servico[]
  motivo_geral: string
  total: number
}

export const assistenteService = {
  // contexto_categoria e contexto_busca são campos opcionais aceitos pelo backend
  chat: (
    mensagem: string,
    historico?: { papel: string; conteudo: string }[],
    contexto_categoria?: string,
    contexto_busca?: string,
  ) =>
    api
      .post<{ resposta: string; mensagem: MensagemArky }>('/assistente/chat', {
        mensagem,
        historico,
        contexto_categoria,
        contexto_busca,
      })
      .then(r => r.data),

  // GAP-009: retorna RecomendacoesArkyResponse, não Servico[]
  recomendacoes: (contexto: string) =>
    api
      .post<RecomendacoesArkyResponse>('/assistente/recomendacoes', { contexto })
      .then(r => r.data),

  info: () => api.get('/assistente/info').then(r => r.data),
}
