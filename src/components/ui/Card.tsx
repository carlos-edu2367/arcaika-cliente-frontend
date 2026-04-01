import * as React from 'react'
import { cn } from '@/utils/cn'

export type CardVariant = 'default' | 'elevated' | 'flat' | 'interactive'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-neutral-200 shadow-sm rounded-lg',
  elevated: 'bg-white shadow-md rounded-xl',
  flat: 'bg-neutral-100 rounded-lg',
  interactive:
    'bg-white border border-neutral-200 shadow-sm rounded-lg cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200',
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

/** Container card component with variants and sub-components */
export function Card({ variant = 'default', padding = 'none', className, children, ...props }: CardProps) {
  return (
    <div className={cn(variantClasses[variant], paddingClasses[padding], className)} {...props}>
      {children}
    </div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

Card.Header = function CardHeader({ title, subtitle, className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('px-4 pt-4 pb-2', className)} {...props}>
      {title && <h3 className="text-base font-semibold text-neutral-900">{title}</h3>}
      {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
      {children}
    </div>
  )
}

Card.Body = function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3', className)} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 pb-4 pt-2 border-t border-neutral-100', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/2'
}

Card.Image = function CardImage({ aspectRatio = '16/9', className, alt = '', ...props }: CardImageProps) {
  const ratioClass: Record<string, string> = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '3/2': 'aspect-[3/2]',
  }
  return (
    <div className={cn('overflow-hidden rounded-t-lg', ratioClass[aspectRatio])}>
      <img
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        {...props}
      />
    </div>
  )
}
