import * as React from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import type { Toast as ToastType } from '@/types/ui'

const typeConfig: Record<
  ToastType['type'],
  { icon: React.ReactNode; className: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} className="text-success flex-shrink-0" />,
    className: 'border-l-4 border-l-success',
  },
  error: {
    icon: <AlertCircle size={18} className="text-error flex-shrink-0" />,
    className: 'border-l-4 border-l-error',
  },
  warning: {
    icon: <AlertTriangle size={18} className="text-warning flex-shrink-0" />,
    className: 'border-l-4 border-l-warning',
  },
  info: {
    icon: <Info size={18} className="text-info flex-shrink-0" />,
    className: 'border-l-4 border-l-info',
  },
}

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const config = typeConfig[toast.type]

  return (
    <RadixToast.Root
      open
      onOpenChange={(open) => !open && removeToast(toast.id)}
      className={cn(
        'bg-white rounded-lg shadow-xl border border-neutral-200',
        'flex items-start gap-3 p-4 w-full max-w-sm',
        'data-[state=open]:animate-slide-in-right',
        'data-[state=closed]:opacity-0 transition-opacity duration-200',
        config.className,
      )}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        <RadixToast.Title className="text-sm font-semibold text-neutral-900">
          {toast.title}
        </RadixToast.Title>
        {toast.message && (
          <RadixToast.Description className="text-xs text-neutral-500 mt-0.5">
            {toast.message}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close asChild>
        <button
          aria-label="Fechar notificação"
          className="text-neutral-400 hover:text-neutral-600 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </RadixToast.Close>
    </RadixToast.Root>
  )
}

/** Global toast container — mount once in App.tsx */
export function Toaster() {
  const toasts = useUIStore((s) => s.toasts)

  return (
    <RadixToast.Provider swipeDirection="right">
      <div className="fixed top-20 right-4 sm:top-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </div>
      </div>
      <RadixToast.Viewport className="fixed top-16 sm:top-0 right-0 p-4 z-[100] flex flex-col gap-2 max-w-sm w-full list-none outline-none" />
    </RadixToast.Provider>
  )
}
