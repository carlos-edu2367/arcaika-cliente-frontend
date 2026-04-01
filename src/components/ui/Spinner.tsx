import * as React from 'react'
import { cn } from '@/utils/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg'
export type SpinnerColor = 'primary' | 'white' | 'muted'

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-3 w-3',
}

const colorClasses: Record<SpinnerColor, string> = {
  primary: 'bg-primary',
  white: 'bg-white',
  muted: 'bg-neutral-400',
}

export interface SpinnerProps {
  size?: SpinnerSize
  color?: SpinnerColor
  className?: string
  /** Accessible label */
  label?: string
}

/** 
 * Modern staggered dots loading indicator. 
 * Provides a more "fun" and premium feel than a standard border-spin.
 */
export function Spinner({ 
  size = 'md', 
  color = 'primary', 
  className, 
  label = 'Carregando...' 
}: SpinnerProps) {
  const dotClass = cn(
    'rounded-full animate-bounce-stagger',
    sizeClasses[size],
    colorClasses[color]
  )

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <span className={dotClass} style={{ animationDelay: '0ms' }} />
      <span className={dotClass} style={{ animationDelay: '150ms' }} />
      <span className={dotClass} style={{ animationDelay: '300ms' }} />
    </div>
  )
}
