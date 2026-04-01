import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover focus-visible:ring-primary',
  secondary:
    'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-400',
  outline:
    'border border-neutral-200 bg-transparent text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-400',
  ghost:
    'bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400',
  destructive:
    'bg-error text-white hover:bg-red-700 focus-visible:ring-error',
  link:
    'bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto focus-visible:ring-primary',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
  xl: 'h-14 px-8 text-base',
  icon: 'h-10 w-10 p-0',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant
  /** Size of the button */
  size?: ButtonSize
  /** Shows a loading spinner and disables interaction */
  isLoading?: boolean
  /** Icon or element rendered to the left of the label */
  leftIcon?: React.ReactNode
  /** Icon or element rendered to the right of the label */
  rightIcon?: React.ReactNode
  /** Stretches the button to 100% width */
  fullWidth?: boolean
  /** Render as child element via Radix Slot */
  asChild?: boolean
}

/**
 * Primary interactive action component.
 * Supports multiple variants, sizes, loading state and icon slots.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      asChild = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || isLoading

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2 rounded-md font-semibold',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          // Full width
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner
            size="sm"
            color={variant === 'primary' || variant === 'destructive' ? 'white' : 'primary'}
          />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </Comp>
    )
  },
)

Button.displayName = 'Button'
