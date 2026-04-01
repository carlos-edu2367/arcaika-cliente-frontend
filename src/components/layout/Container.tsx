import { cn } from '@/lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const maxWidthMap = {
  sm: 'max-w-sm', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl', '2xl': 'max-w-7xl', full: 'max-w-full'
}

export function Container({ maxWidth = 'xl', className, children, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4', maxWidthMap[maxWidth], className)} {...props}>
      {children}
    </div>
  )
}
