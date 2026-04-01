import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  fullscreen: 'max-w-none w-full h-full rounded-none m-0',
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: ModalSize
  closeOnOverlayClick?: boolean
  children?: React.ReactNode
  /** Footer actions */
  footer?: React.ReactNode
}

/**
 * Accessible modal dialog built on Radix UI Dialog.
 * Focus is trapped inside, closes with Escape key.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  closeOnOverlayClick = true,
  children,
  footer,
}: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in',
          )}
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
        <Dialog.Content
          onInteractOutside={(e) => {
            if (!closeOnOverlayClick) e.preventDefault()
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100vw-32px)] bg-white rounded-xl shadow-xl',
            'focus:outline-none',
            'data-[state=open]:animate-slide-up',
            sizeClasses[size],
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-neutral-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-neutral-500 mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="rounded-md p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 pb-5 pt-3 flex justify-end gap-3 border-t border-neutral-100">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
