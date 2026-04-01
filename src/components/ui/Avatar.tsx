import * as RadixAvatar from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' }

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const initials = fallback ?? alt?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  return (
    <RadixAvatar.Root className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizeClasses[size], className)}>
      {src && <RadixAvatar.Image src={src} alt={alt ?? ''} className="aspect-square h-full w-full object-cover" />}
      <RadixAvatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}
