import * as React from 'react'
import { cn } from '@/utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: 'text' | 'circle' | 'rect' | 'card'
  /** Enable shimmer animation */
  animated?: boolean
  width?: string | number
  height?: string | number
}

/** Base skeleton shimmer block */
export function Skeleton({
  variant = 'rect',
  animated = true,
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-neutral-200',
        animated && 'bg-shimmer',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rect' && 'rounded-md',
        variant === 'card' && 'rounded-lg',
        className,
      )}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}

// ─── Pre-built composite skeletons ──────────────────────────────────────────

/** Skeleton matching ServiceCard shape */
export function SkeletonServiceCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden" aria-hidden="true">
      <Skeleton variant="rect" className="w-full h-48" />
      <div className="p-4 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton variant="rect" className="w-16 h-5 rounded-full" />
          <Skeleton variant="text" className="w-20" />
        </div>
      </div>
    </div>
  )
}

/** Skeleton for a text block with multiple lines */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

/** Skeleton for an avatar circle */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }
  return <Skeleton variant="circle" className={sizeClasses[size]} />
}

/** Skeleton matching PedidoCard shape */
export function SkeletonPedidoCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3" aria-hidden="true">
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-32" />
        <Skeleton variant="rect" className="w-20 h-5 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-1/2 h-3" />
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="w-24 h-3" />
        <Skeleton variant="text" className="w-16" />
      </div>
    </div>
  )
}
