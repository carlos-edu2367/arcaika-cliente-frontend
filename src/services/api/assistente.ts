import { api } from '@/lib/axios'
import type { ArkyToolCall, MensagemArky, MessageBlock, Servico } from '@/types/domain'

export interface ChatAssistenteResponse {
  resposta: string
  mensagens_processadas?: number
  modelo_utilizado?: string
  token_estimado?: number | null
  tool_calls?: ArkyToolCall[]
  blocos?: MessageBlock[]
  mensagem?: MensagemArky
}

export interface ContextoClienteAssistente {
  localizacao?: {
    cidade?: string
    estado?: string
    pais?: string
    latitude?: number
    longitude?: number
    permitido: boolean
    origem?: 'selecionada' | 'gps' | 'perfil' | 'nenhuma'
  }
  idioma?: string
  timezone?: string
  device_locale?: string
  rota_atual?: string
}

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
    contexto_cliente?: ContextoClienteAssistente,
    contexto_categoria?: string,
    contexto_busca?: string,
  ) =>
    api
      .post<ChatAssistenteResponse>('/assistente/chat', {
        mensagem,
        historico,
        contexto_cliente,
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
