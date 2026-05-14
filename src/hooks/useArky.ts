import { useState, useCallback } from 'react'
import { assistenteService } from '@/services/api/assistente'
import type { ContextoClienteAssistente } from '@/services/api/assistente'
import type { MensagemArky } from '@/types/domain'
import { generateId } from '@/lib/utils'
import { useLocationStore } from '@/stores/locationStore'

const SESSION_KEY = 'arcaika_arky_history'
const MAX_MSGS = 50
const MAX_HISTORY_TURNS = 10
const MAX_HISTORY_MESSAGES = MAX_HISTORY_TURNS * 2

function loadHistory(): MensagemArky[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    // Filtra entradas corrompidas/indefinidas para evitar crash no map do ArkyDrawer
    return (parsed as MensagemArky[]).filter(
      (m): m is MensagemArky => !!m && typeof m.tipo === 'string' && typeof m.conteudo === 'string'
    )
  } catch {
    return []
  }
}

function saveHistory(msgs: MensagemArky[]) {
  try {
    // Mantém apenas as últimas MAX_MSGS mensagens para não sobrecarregar
    const slice = msgs.slice(-MAX_MSGS)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(slice))
  } catch {
    // sessionStorage indisponível (modo privado, cota cheia) — ignora silenciosamente
  }
}

function toBackendHistory(msgs: MensagemArky[]) {
  return msgs
    .filter((m) => m.tipo === 'usuario' || m.tipo === 'arky')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      papel: m.tipo === 'usuario' ? 'usuario' : 'assistente',
      conteudo: m.conteudo,
    }))
}

function buildContextoCliente(): ContextoClienteAssistente {
  const { localidade, hasChosen } = useLocationStore.getState()
  const contexto: ContextoClienteAssistente = {
    idioma: typeof navigator !== 'undefined' ? navigator.language : undefined,
    device_locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    rota_atual: typeof window !== 'undefined' ? window.location.pathname : undefined,
  }
  if (hasChosen && localidade) {
    contexto.localizacao = {
      cidade: localidade.cidade,
      estado: localidade.estado,
      pais: 'BR',
      permitido: true,
      origem: 'selecionada',
    }
  }
  return contexto
}

export function useArky() {
  const [mensagens, setMensagens] = useState<MensagemArky[]>(loadHistory)
  const [isLoading, setIsLoading] = useState(false)

  const setAndPersist = useCallback((updater: (prev: MensagemArky[]) => MensagemArky[]) => {
    setMensagens((prev) => {
      const next = updater(prev)
      saveHistory(next)
      return next
    })
  }, [])

  const enviar = useCallback(async (texto: string) => {
    const userMsg: MensagemArky = { id: generateId(), conteudo: texto, tipo: 'usuario', criado_em: new Date().toISOString() }
    const historico = toBackendHistory(loadHistory())
    setAndPersist((prev) => [...prev, userMsg])
    setIsLoading(true)
    try {
      // Envia o texto atual separado do historico anterior.
      const res = await assistenteService.chat(texto, historico, buildContextoCliente())
      // Guard: backend pode não retornar mensagem em alguns casos de erro
      if (res.mensagem?.tipo && res.mensagem?.conteudo) {
        const arkyMsg: MensagemArky = {
          ...res.mensagem,
          tool_calls: res.mensagem.tool_calls ?? res.tool_calls,
          modelo_utilizado: res.mensagem.modelo_utilizado ?? res.modelo_utilizado,
          blocos: res.mensagem.blocos ?? res.blocos,
        }
        setAndPersist((prev) => [...prev, arkyMsg])
      } else if (res.resposta) {
        // Fallback: constrói mensagem a partir do campo resposta
        const arkyMsg: MensagemArky = {
          id: generateId(),
          conteudo: res.resposta,
          tipo: 'arky',
          criado_em: new Date().toISOString(),
          tool_calls: res.tool_calls,
          modelo_utilizado: res.modelo_utilizado,
          blocos: res.blocos,
        }
        setAndPersist((prev) => [...prev, arkyMsg])
      }
    } catch {
      const errMsg: MensagemArky = {
        id: generateId(),
        conteudo: 'Desculpe, não consegui responder agora. Tente novamente.',
        tipo: 'arky',
        criado_em: new Date().toISOString(),
      }
      setAndPersist((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [setAndPersist])

  const limpar = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setMensagens([])
  }, [])

  return { mensagens, isLoading, enviar, limpar }
}
