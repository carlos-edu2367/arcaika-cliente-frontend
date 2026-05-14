import { useNavigate } from 'react-router-dom'
import type { ProductCardData } from '@/types/domain'
import { cn } from '@/lib/utils'

const HREF_PATTERN = /^\/servicos\/[0-9a-f-]{36}$/i

function sanitizeHref(href: unknown): string | null {
  if (typeof href !== 'string') return null
  const trimmed = href.trim()
  return HREF_PATTERN.test(trimmed) ? trimmed : null
}

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, maxLen)
}

function sanitizeImageUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed || trimmed.length > 2048) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:') return null
    return trimmed
  } catch {
    return null
  }
}

function isValidProductCardData(raw: unknown): raw is ProductCardData {
  if (!raw || typeof raw !== 'object') return false
  const d = raw as Record<string, unknown>
  return (
    typeof d.id === 'string' && d.id.length > 0 &&
    typeof d.nome === 'string' && d.nome.length > 0 &&
    typeof d.href === 'string'
  )
}

interface ProductCardProps {
  dados: ProductCardData
  className?: string
}

export function ProductCard({ dados, className }: ProductCardProps) {
  const navigate = useNavigate()

  if (!isValidProductCardData(dados)) return null

  const href = sanitizeHref(dados.href)
  if (!href) return null

  const nome = sanitizeString(dados.nome, 200)
  const descricao = sanitizeString(dados.descricao, 240)
  const precoLabel = sanitizeString(dados.preco_label, 60) || 'Consultar'
  const categoria = sanitizeString(dados.categoria ?? '', 60) || null
  const imageUrl = sanitizeImageUrl(dados.image_url)

  const handleClick = () => navigate(href)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(href)
    }
  }

  return (
    <div
      role="article"
      aria-label={`Serviço: ${nome}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={cn(
        'group flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 cursor-pointer',
        'hover:border-primary hover:shadow-sm transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary-400',
        className,
      )}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={nome}
          className="h-14 w-14 rounded-lg object-cover flex-shrink-0 bg-neutral-100"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      )}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {categoria && (
            <span className="inline-block text-[10px] font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-2 py-0.5 mb-1">
              {categoria}
            </span>
          )}
          <p className="text-sm font-semibold text-neutral-900 leading-tight line-clamp-2">
            {nome}
          </p>
          {descricao && (
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
              {descricao}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-semibold text-primary">
            {precoLabel}
          </span>
          <span className="text-[10px] font-medium text-primary-700 group-hover:underline">
            Ver serviço →
          </span>
        </div>
      </div>
    </div>
  )
}
