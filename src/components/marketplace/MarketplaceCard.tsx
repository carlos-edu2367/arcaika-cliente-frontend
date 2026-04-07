import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ShoppingCart, Star } from 'lucide-react'
import type { MarketplaceItem, MarketplaceServico } from '@/types/marketplace'
import { formatCurrency, cn } from '@/lib/utils'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useItemPhotos, useServicePhotos } from '@/hooks/useMidia'
import { Skeleton } from '@/components/ui/Skeleton'

interface MarketplaceCardProps {
  item: MarketplaceItem | MarketplaceServico
  tipo: 'item' | 'servico'
  imageUrl?: string
  isImageLoading?: boolean
  className?: string
}

export function MarketplaceCard({ item, tipo, imageUrl, isImageLoading, className }: MarketplaceCardProps) {
  const { adicionarServico, adicionarItem } = useCarrinho()
  const hasPhotos = (item.fotos_count ?? 0) > 0
  
  // Se não foi passada imageUrl via batch, o card busca individualmente
  const itemPhotos = useItemPhotos(tipo === 'item' && hasPhotos && !imageUrl ? item.id : '')
  const servicePhotos = useServicePhotos(tipo === 'servico' && hasPhotos && !imageUrl ? item.id : '')
  
  const photosData = tipo === 'item' ? itemPhotos.data : servicePhotos.data
  
  // O loading da imagem acontece se:
  // 1. O batch pai está carregando (isImageLoading)
  // 2. Ou estamos buscando a foto individualmente (itemPhotos.isLoading/servicePhotos.isLoading)
  const isWaitingForPhoto = hasPhotos && (
    isImageLoading || 
    (!imageUrl && (tipo === 'item' ? itemPhotos.isLoading : servicePhotos.isLoading))
  )
  
  const coverPhoto = imageUrl || photosData?.fotos?.[0]?.url

  const titulo = item.titulo
  const s = item as MarketplaceServico
  const precoEfetivoVal = s.preco_efetivo ? parseFloat(s.preco_efetivo) : null
  const preco = precoEfetivoVal ?? (typeof item.preco === 'number' ? item.preco : parseFloat(item.preco ?? '0'))
  const precoPromocional = item.preco_promocional ? (typeof item.preco_promocional === 'number' ? item.preco_promocional : parseFloat(item.preco_promocional)) : null
  const emPromocao = !!item.em_promocao
  const motivo = s.motivo

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (tipo === 'servico') {
      adicionarServico.mutate({ id: item.id })
    } else {
      adicionarItem.mutate({ id: item.id })
    }
  }

  const linkTo = tipo === 'servico' ? `/servicos/${item.id}` : `/itens/${item.id}`

  return (
    <div className={cn('bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full', className)}>
      <Link to={linkTo} className="block relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {isWaitingForPhoto ? (
          <div className="w-full h-full animate-pulse bg-neutral-200 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">...</span>
          </div>
        ) : coverPhoto ? (
          <img
            src={coverPhoto}
            alt={titulo}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          /* Fallback */
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-4xl group-hover:scale-110 transition-transform duration-500">
            {tipo === 'servico' ? '🔧' : '📦'}
          </div>
        )}
        
        {emPromocao && (
          <div className="absolute top-3 left-3 bg-warning text-warning-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
            Oferta
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          {tipo === 'servico' && (item as MarketplaceServico).categoria && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">
              {(item as MarketplaceServico).categoria}
            </span>
          )}
          <Link to={linkTo}>
            <h3 className="text-base font-bold text-neutral-900 leading-tight line-clamp-2 group-hover:text-primary transition-colors font-poppins">
              {titulo}
            </h3>
          </Link>
          <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
            {item.descricao}
          </p>

          {motivo && (
            <div className="flex items-center gap-1.5 mt-2 py-1.5 px-2.5 bg-primary-50 border border-primary-100/50 rounded-xl w-fit group/motivo hover:bg-primary-100 hover:border-primary-200 transition-all cursor-default">
              <div className="p-0.5 bg-primary rounded-md text-white">
                <Star size={10} className="fill-white" />
              </div>
              <span className="text-[10px] font-bold text-primary-800 tracking-tight leading-none">
                {motivo}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-50">
          <div>
            {emPromocao && precoPromocional ? (
              <>
                <span className="text-[10px] text-neutral-400 line-through block">
                  {formatCurrency(preco)}
                </span>
                <p className="text-lg font-black text-primary-600">
                  {formatCurrency(precoPromocional)}
                  {tipo === 'servico' && (item as MarketplaceServico).unidade_medida && (
                    <span className="text-[10px] text-neutral-400 font-bold uppercase ml-1">
                      / {(item as MarketplaceServico).unidade_medida}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <>
                <span className="text-[10px] text-neutral-400 block">
                  {tipo === 'servico' ? 'A partir de' : 'Por apenas'}
                </span>
                <p className="text-lg font-black text-neutral-900">
                  {formatCurrency(preco)}
                  {tipo === 'servico' && (item as MarketplaceServico).unidade_medida && (
                    <span className="text-[10px] text-neutral-400 font-bold uppercase ml-1">
                      / {(item as MarketplaceServico).unidade_medida}
                    </span>
                  )}
                </p>
              </>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center justify-center w-10 h-10 bg-primary-50 text-primary hover:bg-primary hover:text-white rounded-xl transition-all active:scale-90 shadow-sm"
            title="Adicionar ao carrinho"
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
