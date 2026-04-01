import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ShoppingCart } from 'lucide-react'
import type { Servico } from '@/types/domain'
import { formatCurrency, cn } from '@/lib/utils'
import { Stars } from '@/components/ui/Stars'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useServicePhotos } from '@/hooks/useMidia'
import { Skeleton } from '@/components/ui/Skeleton'

interface ServiceCardProps {
  servico: Servico
  imageUrl?: string
  isImageLoading?: boolean
  className?: string
}

// PERF-06: React.memo para evitar re-renders ao trocar filtros sem mudança de dado
function ServiceCardComponent({ servico, imageUrl, isImageLoading, className }: ServiceCardProps) {
  const { adicionarServico } = useCarrinho()
  const hasPhotos = (servico.fotos_count ?? 0) > 0

  const { data: photosData, isLoading: isLoadingIndividual } = useServicePhotos(
    !imageUrl && hasPhotos ? servico.id : ''
  )
  
  const isWaitingForPhoto = hasPhotos && (isImageLoading || (!imageUrl && isLoadingIndividual))
  const coverPhoto = imageUrl || photosData?.fotos?.[0]?.url

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow', className)}>
      <Link to={`/servicos/${servico.id}`} className="block">
        <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
          {isWaitingForPhoto ? (
            <div className="w-full h-full animate-pulse bg-neutral-200 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest text-center px-4">...</span>
            </div>
          ) : coverPhoto ? (
            <img
              src={coverPhoto}
              alt={servico.nome}
              loading="lazy"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300 text-4xl">🔧</div>
          )}
        </div>
      </Link>

      <div className="p-3 flex flex-col gap-2">
        <div>
          <span className="text-[10px] font-medium text-primary-600 uppercase tracking-wide">
            {servico.categoria.valor}
          </span>
          <Link to={`/servicos/${servico.id}`}>
            <h3 className="text-sm font-semibold text-neutral-900 leading-tight line-clamp-2 hover:text-primary-600 transition-colors">
              {servico.nome}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <Stars rating={servico.avaliacao_media} size="sm" showValue />
          <span className="text-neutral-400">({servico.total_avaliacoes})</span>
        </div>

        {servico.localidade && (
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <MapPin size={10} />
            <span className="truncate">{servico.localidade}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-xs text-neutral-400">A partir de</span>
            <p className="text-base font-bold text-primary-600">{formatCurrency(servico.preco)}</p>
          </div>
          <button
            onClick={() => adicionarServico.mutate({ id: servico.id })}
            disabled={!servico.disponivel || adicionarServico.isPending}
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <ShoppingCart size={12} />
            {servico.disponivel ? 'Adicionar' : 'Indisponível'}
          </button>
        </div>
      </div>
    </div>
  )
}

// PERF-06: comparação por id evita re-render quando o array de serviços é recriado mas os dados não mudaram
export const ServiceCard = React.memo(ServiceCardComponent, (prev, next) => prev.servico.id === next.servico.id && prev.className === next.className)
