import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  wrapperClassName?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, wrapperClassName, className, id, ...props }, ref) => {
    const textareaId = id ?? React.useId()
    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-neutral-700">
            {label}{required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'disabled:cursor-not-allowed disabled:bg-neutral-100',
            error ? 'border-red-500' : 'border-neutral-200',
            className,
          )}
          {...props}
        />
        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
