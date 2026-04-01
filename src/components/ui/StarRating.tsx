import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 20, md: 28, lg: 36 }

export function StarRating({ value, onChange, max = 5, size = 'md', className }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const px = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1
        const active = (hover || value) >= starValue

        return (
          <button
            key={i}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(starValue)}
          >
            <Star
              width={px}
              height={px}
              className={cn(
                'transition-colors duration-200',
                active ? 'fill-amber-400 text-amber-400' : 'fill-neutral-100 text-neutral-200'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
