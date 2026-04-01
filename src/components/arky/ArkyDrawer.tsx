import { useEffect, useRef, useState } from 'react'
import { X, Send, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useUIStore } from '@/stores/uiStore'
import { useArky } from '@/hooks/useArky'
import { cn } from '@/lib/utils'

const SUGESTOES = [
  'Como funciona o orçamento?',
  'Quero contratar um serviço',
  'Como pago pelo serviço?',
  'Meus pedidos',
]

import { Spinner } from '@/components/ui/Spinner'

function TypingIndicator() {
  return (
    <div className="self-start bg-neutral-100 px-3 py-2 rounded-2xl rounded-bl-sm flex items-center shrink-0">
      <Spinner size="sm" color="muted" label="Arky está digitando..." />
    </div>
  )
}

export function ArkyDrawer() {
  const { isArkyOpen, closeArky } = useUIStore()
  const { mensagens, isLoading, enviar } = useArky()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
    }, 100)
    return () => clearTimeout(timer)
  }, [mensagens, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await enviar(text)
  }

  const handleSugestao = async (sugestao: string) => {
    if (isLoading) return
    await enviar(sugestao)
  }

  if (!isArkyOpen) return null

  const isEmpty = mensagens.length === 0

  return (
    <div role="dialog" aria-modal="true" aria-label="Chat com Arky" onKeyDown={(e) => e.key === 'Escape' && closeArky()} className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-24 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary text-white flex-shrink-0">
        <Bot size={20} />
        <div className="flex-1">
          <p className="text-sm font-semibold">Arky</p>
          <p className="text-[10px] opacity-80">Assistente Arcaika</p>
        </div>
        <button
          onClick={closeArky}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div role="log" aria-live="polite" aria-label="Conversa com o Arky" className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-neutral-400 py-6">
            <Bot size={40} strokeWidth={1} className="text-primary opacity-70" />
            <p className="text-sm font-semibold text-neutral-700">Olá! Sou o Arky.</p>
            <p className="text-xs text-neutral-500">
              Posso ajudar a encontrar serviços, responder dúvidas e muito mais.
            </p>
          </div>
        )}

        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              // A classe shrink-0 impede que o flexbox esmague as mensagens na vertical
              'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed shrink-0',
              msg.tipo === 'usuario'
                ? 'self-end bg-primary text-white rounded-br-sm'
                : 'self-start bg-neutral-100 text-neutral-800 rounded-bl-sm',
            )}
          >
            {msg.tipo === 'usuario' ? (
              <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
            ) : (
              <div className="space-y-2 break-words text-neutral-800">
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 last:mb-0" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 last:mb-0" {...props} />,
                    li: ({ node, ...props }) => <li className="" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-neutral-900" {...props} />,
                  }}
                >
                  {msg.conteudo}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions — only when chat is empty */}
      {isEmpty && (
        <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              onClick={() => handleSugestao(s)}
              disabled={isLoading}
              className="whitespace-nowrap text-xs bg-primary-light text-primary-700 border border-primary-200 px-2.5 py-1.5 rounded-full hover:bg-primary-100 transition-colors flex-shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-neutral-100 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 text-sm rounded-full border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-40 text-white flex items-center justify-center transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}