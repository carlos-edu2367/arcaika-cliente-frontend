import * as React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label */
  label?: string
  /** Help text shown below the input */
  hint?: string
  /** Error message (turns border red) */
  error?: string
  /** Element shown on the left inside the input */
  leftElement?: React.ReactNode
  /** Element shown on the right inside the input */
  rightElement?: React.ReactNode
  /** Whether the field is required */
  required?: boolean
  /** Container className */
  wrapperClassName?: string
}

/**
 * Accessible text input with label, hint, error and icon slot support.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftElement,
      rightElement,
      required,
      wrapperClassName,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? React.useId()
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
            {required && (
              <span className="ml-1 text-error" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <div className="pointer-events-none absolute left-3 flex items-center text-neutral-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            className={cn(
              'w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900',
              'placeholder:text-neutral-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-primary',
              'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
              error
                ? 'border-error focus:ring-error'
                : 'border-neutral-200',
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              className,
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center text-neutral-400">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

// ─── Textarea variant ────────────────────────────────────────────────────────

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
    const errorId = `${textareaId}-error`

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-neutral-700">
            {label}
            {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900',
            'placeholder:text-neutral-400 resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'disabled:cursor-not-allowed disabled:bg-neutral-100',
            error ? 'border-error' : 'border-neutral-200',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500">{hint}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
