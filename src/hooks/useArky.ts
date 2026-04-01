import { useState, useCallback } from 'react'
import { assistenteService } from '@/services/api/assistente'
import type { MensagemArky } from '@/types/domain'
import { generateId } from '@/lib/utils'

const SESSION_KEY = 'arcaika_arky_history'
const MAX_MSGS = 50

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
    setAndPersist((prev) => [...prev, userMsg])
    setIsLoading(true)
    try {
      // Usa o histórico atual (lido diretamente do sessionStorage para garantir consistência)
      const historico = loadHistory().map((m) => ({
        papel: m.tipo === 'usuario' ? 'usuario' : 'assistente', // <-- Valores corrigidos aqui
        conteudo: m.conteudo,
      }))
      const res = await assistenteService.chat(texto, historico)
      // Guard: backend pode não retornar mensagem em alguns casos de erro
      if (res.mensagem?.tipo && res.mensagem?.conteudo) {
        setAndPersist((prev) => [...prev, res.mensagem])
      } else if (res.resposta) {
        // Fallback: constrói mensagem a partir do campo resposta
        const arkyMsg: MensagemArky = {
          id: generateId(),
          conteudo: res.resposta,
          tipo: 'arky',
          criado_em: new Date().toISOString(),
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
