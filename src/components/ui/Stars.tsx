import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarsProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const sizeMap = { sm: 12, md: 16, lg: 20 }

export function Stars({ rating, max = 5, size = 'md', showValue = false, className }: StarsProps) {
  const px = sizeMap[size]
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          width={px}
          height={px}
          className={i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'}
        />
      ))}
      {showValue && <span className="ml-1 text-sm text-neutral-600">{rating.toFixed(1)}</span>}
    </span>
  )
}
