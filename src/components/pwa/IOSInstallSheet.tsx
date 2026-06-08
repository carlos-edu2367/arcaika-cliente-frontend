import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Share, Plus, X } from 'lucide-react'

interface IOSInstallSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Bottom-sheet com as instruções manuais para instalar o PWA no iOS/Safari.
 *
 * O iOS NÃO oferece API de instalação — o usuário precisa usar
 * Compartilhar → "Adicionar à Tela de Início". Aqui só guiamos esse passo a passo.
 */
export function IOSInstallSheet({ open, onClose }: IOSInstallSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // Trava o scroll do body enquanto o sheet está aberto.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Como instalar o aplicativo no iPhone"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 p-1.5 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-neutral-900 pr-8">Instalar o app Arcaika</h2>
        <p className="mt-1 text-sm text-neutral-500">
          No iPhone/iPad o app é adicionado pela própria Safari em 2 passos:
        </p>

        <ol className="mt-5 space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
              1
            </span>
            <span className="text-sm text-neutral-700 leading-7">
              Toque no botão{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
                Compartilhar <Share size={16} className="text-primary" />
              </span>{' '}
              na barra do Safari.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
              2
            </span>
            <span className="text-sm text-neutral-700 leading-7">
              Escolha{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
                Adicionar à Tela de Início <Plus size={16} className="text-primary" />
              </span>
              .
            </span>
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>,
    document.body,
  )
}
