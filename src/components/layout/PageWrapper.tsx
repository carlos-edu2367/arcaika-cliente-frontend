import { cn } from '@/lib/utils'

interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean
}

export function PageWrapper({ noPadding, className, children, ...props }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'min-h-[calc(100vh-3.5rem)] pb-16 md:pb-0',
        !noPadding && 'py-6',
        className,
      )}
      {...props}
    >
      {children}
    </main>
  )
}
