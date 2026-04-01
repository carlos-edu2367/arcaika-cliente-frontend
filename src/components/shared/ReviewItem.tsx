import React from 'react'
import { Stars } from '@/components/ui/Stars'
import { formatDate } from '@/lib/utils'

interface ReviewItemProps {
  av: any
}

export function ReviewItem({ av }: ReviewItemProps) {
  const nome = av.cliente_nome || av.autor?.nome || 'Usuário'
  const iniciais = nome.charAt(0).toUpperCase()

  return (
    <div className="py-6 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold shadow-inner shrink-0">
          {iniciais}
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900">{nome}</p>
          <div className="flex items-center gap-2">
            <Stars rating={av.nota} size="sm" />
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{formatDate(av.criado_em)}</span>
          </div>
        </div>
      </div>
      {(av.titulo || av.comentario) && (
        <div className="pl-13">
          {av.titulo && <p className="text-sm font-black text-neutral-800 mb-1">{av.titulo}</p>}
          {av.comentario && <p className="text-sm text-neutral-600 leading-relaxed italic">"{av.comentario}"</p>}
        </div>
      )}
    </div>
  )
}
